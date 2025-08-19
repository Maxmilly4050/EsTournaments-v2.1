import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { BracketProgressionService } from "@/lib/bracket-progression"

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { tournamentId } = await request.json()

    // This endpoint can be called by cron job or admin
    const progressionService = new BracketProgressionService()
    const result = await progressionService.processDeadlineForfeits(tournamentId)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
