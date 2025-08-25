import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request, { params }) {
  try {
    const supabase = createClient()
    const { invitee_username, message } = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find invitee by username
    const { data: invitee, error: inviteeError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", invitee_username)
      .single()

    if (inviteeError || !invitee) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if tournament exists and user has permission to invite
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select(`
        id, name, status, max_participants, created_by,
        tournament_participants(count)
      `)
      .eq("id", params.id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    // Check if user can invite (tournament creator or participant)
    const isCreator = tournament.created_by === user.id
    let isParticipant = false

    if (!isCreator) {
      const { data: participation } = await supabase
        .from("tournament_participants")
        .select("id")
        .eq("tournament_id", params.id)
        .eq("user_id", user.id)
        .single()

      isParticipant = !!participation
    }

    if (!isCreator && !isParticipant) {
      return NextResponse.json({ error: "Not authorized to invite players to this tournament" }, { status: 403 })
    }

    // Check if tournament is full
    const participantCount = tournament.tournament_participants[0]?.count || 0
    if (participantCount >= tournament.max_participants) {
      return NextResponse.json({ error: "Tournament is full" }, { status: 400 })
    }

    // Check if tournament status allows invitations
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return NextResponse.json({ error: "Cannot invite to completed or cancelled tournaments" }, { status: 400 })
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from("tournament_participants")
      .select("id")
      .eq("tournament_id", params.id)
      .eq("user_id", invitee.id)
      .single()

    if (existingParticipant) {
      return NextResponse.json({ error: "User is already a participant" }, { status: 400 })
    }

    // Check for existing pending or accepted invitation
    const { data: existingInvite } = await supabase
      .from("tournament_invites")
      .select("id, status")
      .eq("tournament_id", params.id)
      .eq("invitee_id", invitee.id)
      .in("status", ["pending", "accepted"])
      .single()

    if (existingInvite) {
      const status = existingInvite.status === "pending" ? "already has a pending invitation" : "has already accepted an invitation"
      return NextResponse.json({ error: `User ${status} for this tournament` }, { status: 400 })
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("tournament_invites")
      .insert({
        tournament_id: params.id,
        inviter_id: user.id,
        invitee_id: invitee.id,
        message: message || null
      })
      .select(`
        id,
        inviter:profiles!tournament_invites_inviter_id_fkey(username, full_name),
        tournament:tournaments(name)
      `)
      .single()

    if (inviteError) {
      console.error("Error creating invitation:", inviteError)
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
    }

    // Send notification
    try {
      const { NotificationService } = await import("@/lib/notification-service")
      const notificationService = new NotificationService()

      await supabase.from("notifications").insert({
        user_id: invitee.id,
        tournament_id: params.id,
        type: "tournament_invitation",
        title: "Tournament Invitation",
        message: `${invitation.inviter.username} invited you to join "${invitation.tournament.name}". ${message ? `Message: ${message}` : ""}`,
        data: JSON.stringify({
          invitation_id: invitation.id,
          tournament_id: params.id,
          inviter_username: invitation.inviter.username
        })
      })
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError)
      // Don't fail the invitation if notification fails
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        invitee_username,
        tournament_name: invitation.tournament.name
      }
    })

  } catch (error) {
    console.error("Error in invite API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "sent" // "sent" or "received"

    let query = supabase
      .from("tournament_invites")
      .select(`
        id,
        status,
        invited_at,
        expires_at,
        message,
        tournament:tournaments(id, name, status),
        inviter:profiles!tournament_invites_inviter_id_fkey(username, full_name),
        invitee:profiles!tournament_invites_invitee_id_fkey(username, full_name)
      `)
      .eq("tournament_id", params.id)

    if (type === "sent") {
      query = query.eq("inviter_id", user.id)
    } else {
      query = query.eq("invitee_id", user.id)
    }

    const { data: invitations, error } = await query.order("invited_at", { ascending: false })

    if (error) {
      console.error("Error fetching invitations:", error)
      return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
    }

    return NextResponse.json({ invitations })

  } catch (error) {
    console.error("Error in get invitations API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
