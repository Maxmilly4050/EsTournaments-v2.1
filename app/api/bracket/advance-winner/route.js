import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { BracketProgressionService } from "@/lib/bracket-progression"

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { matchId, winnerId } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is tournament organizer or system
    const { data: match } = await supabase
      .from("matches")
      .select("tournament_id, tournaments(organizer_id)")
      .eq("id", matchId)
      .single()

    if (!match || match.tournaments.organizer_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const progressionService = new BracketProgressionService()
    const result = await progressionService.advanceWinner(matchId, winnerId)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
