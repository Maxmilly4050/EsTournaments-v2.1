import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { roundId, deadline } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update round deadline
    const { error: updateError } = await supabase
      .from("tournament_rounds")
      .update({ deadline: new Date(deadline).toISOString() })
      .eq("id", roundId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Update all matches in this round with the deadline
    const { error: matchError } = await supabase
      .from("matches")
      .update({ deadline: new Date(deadline).toISOString() })
      .eq("round", roundId)

    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
