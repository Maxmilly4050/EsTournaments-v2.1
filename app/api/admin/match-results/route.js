import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { resultId, decision, winnerId, adminNotes } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update match result with admin decision
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .update({
        winner_id: winnerId,
        status: decision === "approve" ? "completed" : "pending",
        admin_decision: decision,
        admin_notes: adminNotes,
        requires_admin_review: false,
        completed_at: decision === "approve" ? new Date().toISOString() : null,
      })
      .eq("id", resultId)
      .select("*, tournament_id")
      .single()

    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 400 })
    }

    // Log the admin action
    await supabase.from("tournament_logs").insert({
      tournament_id: match.tournament_id,
      match_id: resultId,
      user_id: user.id,
      action_type: "admin_decision",
      description: `Admin ${decision === "approve" ? "approved" : "rejected"} match result`,
      metadata: { decision, winnerId, adminNotes },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
