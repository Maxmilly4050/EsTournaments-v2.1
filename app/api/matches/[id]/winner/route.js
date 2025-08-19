import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { BracketProgressionService } from "@/lib/bracket-progression"

export async function POST(request, { params }) {
  try {
    console.log("[v0] Match winner API - Confirming winner for match:", params.id)

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get current user for authentication
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser()
    if (authError || !user) {
      console.log("[v0] Match winner API - Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { winner_id } = await request.json()

    if (!winner_id) {
      return NextResponse.json({ error: "Winner ID is required" }, { status: 400 })
    }

    const matchId = Number.parseInt(params.id)
    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 })
    }

    // Get match details and verify user is tournament organizer
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(`
        id, player1_id, player2_id, winner_id, status, tournament_id,
        tournaments!inner(organizer_id, title)
      `)
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      console.log("[v0] Match winner API - Match not found:", matchError)
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user is tournament organizer
    if (match.tournaments.organizer_id !== user.id) {
      return NextResponse.json({ error: "Only tournament organizer can confirm winners" }, { status: 403 })
    }

    // Verify winner is one of the match participants
    if (winner_id !== match.player1_id && winner_id !== match.player2_id) {
      return NextResponse.json({ error: "Winner must be one of the match participants" }, { status: 400 })
    }

    // Check if match is already completed
    if (match.winner_id && match.status === "completed") {
      return NextResponse.json(
        {
          error: "Match already completed",
          current_winner: match.winner_id,
        },
        { status: 409 },
      )
    }

    // Update match with winner and mark as completed
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        winner_id: winner_id,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .select(`
        id, winner_id, status, completed_at, round, match_number,
        player1_id, player2_id, tournament_id
      `)
      .single()

    if (updateError) {
      console.log("[v0] Match winner API - Update failed:", updateError)
      return NextResponse.json({ error: "Failed to confirm winner" }, { status: 500 })
    }

    try {
      const progressionService = new BracketProgressionService()
      const advancementResult = await progressionService.advanceWinner(matchId, winner_id)

      console.log("[v0] Match winner API - Advancement result:", advancementResult)

      // Check if tournament is complete
      if (advancementResult.tournamentComplete) {
        console.log("[v0] Match winner API - Tournament completed with winner:", winner_id)

        return NextResponse.json({
          success: true,
          match_id: matchId,
          winner_id: winner_id,
          status: "completed",
          completed_at: updatedMatch.completed_at,
          tournament_complete: true,
          tournament_winner: winner_id,
        })
      }

      // Tournament continues - winner advanced to next round
      return NextResponse.json({
        success: true,
        match_id: matchId,
        winner_id: winner_id,
        status: "completed",
        completed_at: updatedMatch.completed_at,
        advanced_to_next_round: true,
        next_match: advancementResult.nextMatch,
      })
    } catch (advancementError) {
      console.error("[v0] Match winner API - Advancement error:", advancementError)

      // Match was updated successfully, but advancement failed
      // Log the error but don't fail the entire request
      await supabase.from("tournament_logs").insert({
        tournament_id: match.tournament_id,
        match_id: matchId,
        user_id: user.id,
        action_type: "advancement_error",
        description: `Winner confirmed but advancement failed: ${advancementError.message}`,
        metadata: { winner_id, error: advancementError.message },
      })

      return NextResponse.json({
        success: true,
        match_id: matchId,
        winner_id: winner_id,
        status: "completed",
        completed_at: updatedMatch.completed_at,
        advancement_error: advancementError.message,
        note: "Winner confirmed but automatic advancement failed - please check tournament status",
      })
    }
  } catch (error) {
    console.error("[v0] Match winner API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
