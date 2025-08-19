import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { withEmailVerification } from "@/lib/email-verification-middleware"

async function createTournamentHandler(request) {
  try {
    const supabase = createClient()
    const user = request.user // User is already verified by middleware

    const tournamentData = await request.json()

    // Validate required fields
    const requiredFields = ["title", "game", "tournament_type", "bracket_size", "max_participants"]
    for (const field of requiredFields) {
      if (!tournamentData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .insert([
        {
          ...tournamentData,
          organizer_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (tournamentError) {
      console.error("Error creating tournament:", tournamentError)
      return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tournament,
      message: "Tournament created successfully",
    })
  } catch (error) {
    console.error("Tournament creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withEmailVerification(createTournamentHandler)
