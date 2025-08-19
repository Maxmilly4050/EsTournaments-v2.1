import { createClient } from "@/lib/supabase/server"

export class BracketProgressionService {
  constructor() {
    this.supabase = createClient()
  }

  async advanceWinner(matchId, winnerId) {
    try {
      console.log("[v0] BracketProgressionService - Advancing winner:", { matchId, winnerId })

      // Get the completed match details
      const { data: match, error: matchError } = await this.supabase
        .from("matches")
        .select("*, tournament_id, round, match_number")
        .eq("id", matchId)
        .single()

      if (matchError || !match) {
        throw new Error("Match not found")
      }

      console.log("[v0] BracketProgressionService - Match details:", match)

      // Find the next round match where this winner should advance
      const nextRound = match.round + 1
      const nextMatchNumber = Math.ceil(match.match_number / 2)

      console.log("[v0] BracketProgressionService - Looking for next match:", { nextRound, nextMatchNumber })

      const { data: nextMatch, error: nextMatchError } = await this.supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", match.tournament_id)
        .eq("round", nextRound)
        .eq("match_number", nextMatchNumber)
        .single()

      if (nextMatchError || !nextMatch) {
        console.log("[v0] BracketProgressionService - No next match found, tournament complete")
        // This was the final match - tournament is complete
        await this.completeTournament(match.tournament_id, winnerId)
        return { tournamentComplete: true, winner: winnerId }
      }

      console.log("[v0] BracketProgressionService - Found next match:", nextMatch)

      // Determine which slot the winner should fill (player1 or player2)
      const isFirstSlot = match.match_number % 2 === 1
      const updateField = isFirstSlot ? "player1_id" : "player2_id"

      console.log("[v0] BracketProgressionService - Updating field:", updateField, "with winner:", winnerId)

      // Update the next match with the advancing player
      const { error: updateError } = await this.supabase
        .from("matches")
        .update({ [updateField]: winnerId })
        .eq("id", nextMatch.id)

      if (updateError) {
        throw new Error("Failed to advance winner: " + updateError.message)
      }

      // Check if both players are now assigned to the next match
      const updatedNextMatch = {
        ...nextMatch,
        [updateField]: winnerId,
      }

      console.log("[v0] BracketProgressionService - Updated next match:", updatedNextMatch)

      if (updatedNextMatch.player1_id && updatedNextMatch.player2_id) {
        console.log("[v0] BracketProgressionService - Both players assigned, activating match")
        // Both players assigned - activate the match
        await this.supabase.from("matches").update({ status: "active" }).eq("id", nextMatch.id)

        // Send notifications to both players
        await this.sendMatchNotifications(updatedNextMatch)
      }

      // Log the advancement
      await this.supabase.from("tournament_logs").insert({
        tournament_id: match.tournament_id,
        match_id: matchId,
        user_id: winnerId,
        action_type: "auto_advance",
        description: `Winner advanced to Round ${nextRound}`,
        metadata: { fromRound: match.round, toRound: nextRound },
      })

      await this.checkRoundCompletion(match.tournament_id, match.round)

      return { success: true, nextMatch: updatedNextMatch }
    } catch (error) {
      console.error("[v0] BracketProgressionService - Error advancing winner:", error)
      throw error
    }
  }

  async checkRoundCompletion(tournamentId, round) {
    try {
      console.log("[v0] BracketProgressionService - Checking round completion:", { tournamentId, round })

      const { data: roundMatches, error } = await this.supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("round", round)

      if (error) throw error

      const allCompleted = roundMatches.every((match) => match.status === "completed")
      console.log("[v0] BracketProgressionService - Round completion status:", {
        allCompleted,
        totalMatches: roundMatches.length,
      })

      if (allCompleted) {
        // Update round status to completed (if tournament_rounds table exists)
        try {
          await this.supabase
            .from("tournament_rounds")
            .update({ status: "completed", completed_at: new Date().toISOString() })
            .eq("tournament_id", tournamentId)
            .eq("round_number", round)
        } catch (roundError) {
          // tournament_rounds table might not exist, continue without error
          console.log("[v0] BracketProgressionService - tournament_rounds table not found, skipping round update")
        }

        // Activate next round matches if they exist
        const { data: nextRoundMatches } = await this.supabase
          .from("matches")
          .select("*")
          .eq("tournament_id", tournamentId)
          .eq("round", round + 1)

        if (nextRoundMatches && nextRoundMatches.length > 0) {
          console.log("[v0] BracketProgressionService - Activating next round matches:", nextRoundMatches.length)

          // Activate matches that have both players assigned
          const readyMatches = nextRoundMatches.filter((m) => m.player1_id && m.player2_id)

          if (readyMatches.length > 0) {
            await this.supabase
              .from("matches")
              .update({ status: "active" })
              .in(
                "id",
                readyMatches.map((m) => m.id),
              )

            // Send notifications for newly activated matches
            for (const match of readyMatches) {
              await this.sendMatchNotifications(match)
            }
          }

          // Set deadlines for next round matches
          await this.setRoundDeadlines(tournamentId, round + 1)
        }

        return { roundComplete: true, nextRoundActivated: !!(nextRoundMatches && nextRoundMatches.length > 0) }
      }

      return { roundComplete: false }
    } catch (error) {
      console.error("[v0] BracketProgressionService - Error checking round completion:", error)
      throw error
    }
  }

  async processDeadlineForfeits(tournamentId) {
    try {
      const now = new Date().toISOString()

      // Find matches past deadline with no result
      const { data: expiredMatches, error } = await this.supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("status", "active")
        .lt("deadline", now)

      if (error) throw error

      for (const match of expiredMatches) {
        // Check submission status
        const hasPlayer1Submitted = match.player1_submitted_at
        const hasPlayer2Submitted = match.player2_submitted_at

        let winnerId = null
        let forfeitReason = ""

        if (hasPlayer1Submitted && !hasPlayer2Submitted) {
          winnerId = match.player1_id
          forfeitReason = "Player 2 forfeit (missed deadline)"
        } else if (!hasPlayer1Submitted && hasPlayer2Submitted) {
          winnerId = match.player2_id
          forfeitReason = "Player 1 forfeit (missed deadline)"
        } else if (!hasPlayer1Submitted && !hasPlayer2Submitted) {
          // Both missed deadline - advance random player or handle as double forfeit
          forfeitReason = "Both players forfeit (missed deadline)"
          // For now, we'll mark as completed without winner - admin can decide
        }

        // Update match with forfeit result
        await this.supabase
          .from("matches")
          .update({
            winner_id: winnerId,
            status: "completed",
            completed_at: now,
            admin_notes: forfeitReason,
          })
          .eq("id", match.id)

        // Log the forfeit
        await this.supabase.from("tournament_logs").insert({
          tournament_id: tournamentId,
          match_id: match.id,
          user_id: winnerId,
          action_type: "auto_forfeit",
          description: forfeitReason,
          metadata: { deadline: match.deadline },
        })

        // Advance winner if there is one
        if (winnerId) {
          await this.advanceWinner(match.id, winnerId)
        }
      }

      return { processedForfeits: expiredMatches.length }
    } catch (error) {
      console.error("[v0] BracketProgressionService - Error processing deadline forfeits:", error)
      throw error
    }
  }

  async setRoundDeadlines(tournamentId, round, deadline = null) {
    try {
      // If no deadline provided, set default (24 hours from now)
      const roundDeadline = deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      console.log("[v0] BracketProgressionService - Setting round deadlines:", { tournamentId, round, roundDeadline })

      // Update all matches in the round
      const { error } = await this.supabase
        .from("matches")
        .update({ deadline: roundDeadline })
        .eq("tournament_id", tournamentId)
        .eq("round", round)

      if (error) throw error

      // Update the round record (if tournament_rounds table exists)
      try {
        await this.supabase
          .from("tournament_rounds")
          .update({ deadline: roundDeadline })
          .eq("tournament_id", tournamentId)
          .eq("round_number", round)
      } catch (roundError) {
        // tournament_rounds table might not exist, continue without error
        console.log(
          "[v0] BracketProgressionService - tournament_rounds table not found, skipping round deadline update",
        )
      }

      return { success: true, deadline: roundDeadline }
    } catch (error) {
      console.error("[v0] BracketProgressionService - Error setting round deadlines:", error)
      throw error
    }
  }

  async completeTournament(tournamentId, winnerId) {
    try {
      console.log("[v0] BracketProgressionService - Completing tournament:", { tournamentId, winnerId })

      // Update tournament status
      await this.supabase
        .from("tournaments")
        .update({
          status: "completed",
          end_date: new Date().toISOString(),
        })
        .eq("id", tournamentId)

      // Log tournament completion
      await this.supabase.from("tournament_logs").insert({
        tournament_id: tournamentId,
        user_id: winnerId,
        action_type: "tournament_complete",
        description: `Tournament completed - Winner declared`,
        metadata: { winner: winnerId },
      })

      // Send winner notification
      await this.supabase.from("notifications").insert({
        user_id: winnerId,
        tournament_id: tournamentId,
        type: "tournament_winner",
        title: "🏆 Tournament Champion!",
        message: "Congratulations! You have won the tournament!",
      })

      console.log("[v0] BracketProgressionService - Tournament completion successful")
      return { success: true }
    } catch (error) {
      console.error("[v0] BracketProgressionService - Error completing tournament:", error)
      throw error
    }
  }

  async sendMatchNotifications(match) {
    try {
      console.log("[v0] BracketProgressionService - Sending match notifications:", match.id)

      const notifications = [
        {
          user_id: match.player1_id,
          tournament_id: match.tournament_id,
          match_id: match.id,
          type: "match_ready",
          title: "Match Ready",
          message: `Your Round ${match.round} match is ready to begin!`,
        },
        {
          user_id: match.player2_id,
          tournament_id: match.tournament_id,
          match_id: match.id,
          type: "match_ready",
          title: "Match Ready",
          message: `Your Round ${match.round} match is ready to begin!`,
        },
      ]

      await this.supabase.from("notifications").insert(notifications)
      console.log("[v0] BracketProgressionService - Match notifications sent successfully")
    } catch (error) {
      console.error("[v0] BracketProgressionService - Error sending match notifications:", error)
    }
  }
}
