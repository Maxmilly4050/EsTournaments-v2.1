import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { matchId, playerId, screenshotUrl, reportedWinnerId, reportedScorePlayer1, reportedScorePlayer2 } =
      await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.id !== playerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*, tournament_id, player1_id, player2_id, deadline")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if deadline has passed
    if (match.deadline && new Date() > new Date(match.deadline)) {
      return NextResponse.json({ error: "Submission deadline has passed" }, { status: 400 })
    }

    // Check if user is a participant in this match
    if (match.player1_id !== playerId && match.player2_id !== playerId) {
      return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 })
    }

    const isPlayer1 = match.player1_id === playerId
    const submissionField = isPlayer1 ? "player1_submitted_at" : "player2_submitted_at"
    const screenshotField = isPlayer1 ? "player1_screenshot_url" : "player2_screenshot_url"

    // Check if user has already submitted
    if (match[submissionField]) {
      return NextResponse.json({ error: "You have already submitted a result for this match" }, { status: 400 })
    }

    // Insert match result record
    const { error: resultError } = await supabase.from("match_results").insert({
      match_id: matchId,
      player_id: playerId,
      screenshot_url: screenshotUrl,
      reported_winner_id: reportedWinnerId,
      reported_score_player1: reportedScorePlayer1,
      reported_score_player2: reportedScorePlayer2,
    })

    if (resultError) {
      return NextResponse.json({ error: resultError.message }, { status: 400 })
    }

    // Update match with submission details
    const updateData = {
      [submissionField]: new Date().toISOString(),
      [screenshotField]: screenshotUrl,
    }

    // Check if both players have now submitted
    const otherPlayerSubmitted = isPlayer1 ? match.player2_submitted_at : match.player1_submitted_at

    if (otherPlayerSubmitted) {
      // Both players have submitted - check for conflicts
      const { data: results, error: resultsError } = await supabase
        .from("match_results")
        .select("*")
        .eq("match_id", matchId)

      if (!resultsError && results.length === 2) {
        const [result1, result2] = results

        // Check if both players agree on the winner
        if (result1.reported_winner_id === result2.reported_winner_id) {
          // Auto-approve if both agree
          updateData.winner_id = result1.reported_winner_id
          updateData.player1_score = result1.reported_score_player1
          updateData.player2_score = result1.reported_score_player2
          updateData.status = "completed"
          updateData.completed_at = new Date().toISOString()
        } else {
          // Flag for admin review if they disagree
          updateData.requires_admin_review = true
          updateData.status = "disputed"
        }
      }
    }

    const { error: updateError } = await supabase.from("matches").update(updateData).eq("id", matchId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Log the submission
    await supabase.from("tournament_logs").insert({
      tournament_id: match.tournament_id,
      match_id: matchId,
      user_id: playerId,
      action_type: "result_submitted",
      description: `${isPlayer1 ? "Player 1" : "Player 2"} submitted match result`,
      metadata: { reportedWinnerId, reportedScorePlayer1, reportedScorePlayer2 },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
