import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request, { params }) {
  try {
    const supabase = createClient()
    const { action } = await request.json() // "accept" or "decline"

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'accept' or 'decline'" }, { status: 400 })
    }

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from("tournament_invites")
      .select(`
        id,
        tournament_id,
        inviter_id,
        invitee_id,
        status,
        expires_at,
        tournament:tournaments(id, name, status, max_participants, current_participants),
        inviter:profiles!tournament_invites_inviter_id_fkey(username, full_name)
      `)
      .eq("id", params.inviteId)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Check if user is the invitee
    if (invitation.invitee_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to respond to this invitation" }, { status: 403 })
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
      return NextResponse.json({ error: `Invitation has already been ${invitation.status}` }, { status: 400 })
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // If accepting, check additional conditions
    if (action === "accept") {
      // Check if tournament is still accepting participants
      if (invitation.tournament.status === "completed" || invitation.tournament.status === "cancelled") {
        return NextResponse.json({ error: "Tournament is no longer active" }, { status: 400 })
      }

      // Check if tournament is full
      const { data: participantCount } = await supabase
        .from("tournament_participants")
        .select("id", { count: "exact" })
        .eq("tournament_id", invitation.tournament_id)

      const currentCount = participantCount?.length || 0
      if (currentCount >= invitation.tournament.max_participants) {
        return NextResponse.json({ error: "Tournament is full" }, { status: 400 })
      }

      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from("tournament_participants")
        .select("id")
        .eq("tournament_id", invitation.tournament_id)
        .eq("user_id", user.id)
        .single()

      if (existingParticipant) {
        return NextResponse.json({ error: "You are already a participant in this tournament" }, { status: 400 })
      }
    }

    // Start transaction-like operations
    const now = new Date().toISOString()

    // Update invitation status
    const { error: updateError } = await supabase
      .from("tournament_invites")
      .update({
        status: action === "accept" ? "accepted" : "declined",
        responded_at: now
      })
      .eq("id", params.inviteId)

    if (updateError) {
      console.error("Error updating invitation:", updateError)
      return NextResponse.json({ error: "Failed to update invitation" }, { status: 500 })
    }

    // If accepting, add user to tournament participants
    if (action === "accept") {
      const { error: participantError } = await supabase
        .from("tournament_participants")
        .insert({
          tournament_id: invitation.tournament_id,
          user_id: user.id,
          joined_at: now
        })

      if (participantError) {
        console.error("Error adding participant:", participantError)
        // Try to revert the invitation status
        await supabase
          .from("tournament_invites")
          .update({ status: "pending", responded_at: null })
          .eq("id", params.inviteId)

        return NextResponse.json({ error: "Failed to join tournament" }, { status: 500 })
      }
    }

    // Send notification to inviter
    try {
      const actionText = action === "accept" ? "accepted" : "declined"
      await supabase.from("notifications").insert({
        user_id: invitation.inviter_id,
        tournament_id: invitation.tournament_id,
        type: "invitation_response",
        title: `Invitation ${actionText}`,
        message: `Your tournament invitation to "${invitation.tournament.name}" was ${actionText}.`,
        data: JSON.stringify({
          invitation_id: invitation.id,
          action: action,
          tournament_id: invitation.tournament_id
        })
      })
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError)
      // Don't fail the operation if notification fails
    }

    const responseMessage = action === "accept"
      ? `Successfully joined "${invitation.tournament.name}"!`
      : `Invitation to "${invitation.tournament.name}" declined.`

    return NextResponse.json({
      success: true,
      message: responseMessage,
      action: action,
      tournament: {
        id: invitation.tournament_id,
        name: invitation.tournament.name
      }
    })

  } catch (error) {
    console.error("Error in invitation response API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from("tournament_invites")
      .select(`
        id,
        inviter_id,
        invitee_id,
        status,
        tournament:tournaments(name)
      `)
      .eq("id", params.inviteId)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Check if user can cancel (only inviter can cancel pending invitations)
    if (invitation.inviter_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to cancel this invitation" }, { status: 403 })
    }

    // Can only cancel pending invitations
    if (invitation.status !== "pending") {
      return NextResponse.json({ error: `Cannot cancel ${invitation.status} invitation` }, { status: 400 })
    }

    // Update invitation to cancelled
    const { error: updateError } = await supabase
      .from("tournament_invites")
      .update({
        status: "cancelled",
        responded_at: new Date().toISOString()
      })
      .eq("id", params.inviteId)

    if (updateError) {
      console.error("Error cancelling invitation:", updateError)
      return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Invitation to "${invitation.tournament.name}" has been cancelled.`
    })

  } catch (error) {
    console.error("Error in cancel invitation API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
