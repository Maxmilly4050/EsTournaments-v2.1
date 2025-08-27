import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit")) || 20
    const offset = parseInt(searchParams.get("offset")) || 0
    const unreadOnly = searchParams.get("unread_only") === "true"

    // Build query - fetch notifications without joins to avoid PostgREST relationship issues
    let query = supabase
      .from("notifications")
      .select(`
        id,
        type,
        title,
        message,
        data,
        is_read,
        created_at,
        scheduled_for,
        tournament_id,
        match_id
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data: notifications, error: notificationsError } = await query

    if (notificationsError) {
      console.error("Error fetching notifications:", notificationsError)
      return NextResponse.json({
        success: false,
        error: "Failed to fetch notifications"
      }, { status: 500 })
    }

    // Fetch related tournament and match data separately to avoid relationship errors
    const enrichedNotifications = []

    if (notifications && notifications.length > 0) {
      // Get unique tournament IDs and match IDs
      const tournamentIds = [...new Set(notifications.filter(n => n.tournament_id).map(n => n.tournament_id))]
      const matchIds = [...new Set(notifications.filter(n => n.match_id).map(n => n.match_id))]

      // Fetch tournaments data
      let tournamentsData = {}
      if (tournamentIds.length > 0) {
        const { data: tournaments, error: tournamentError } = await supabase
          .from('tournaments')
          .select('id, name')
          .in('id', tournamentIds)

        if (!tournamentError && tournaments) {
          tournamentsData = tournaments.reduce((acc, tournament) => {
            acc[tournament.id] = tournament
            return acc
          }, {})
        }
      }

      // Fetch matches data
      let matchesData = {}
      if (matchIds.length > 0) {
        const { data: matches, error: matchError } = await supabase
          .from('matches')
          .select('id, round, match_number')
          .in('id', matchIds)

        if (!matchError && matches) {
          matchesData = matches.reduce((acc, match) => {
            acc[match.id] = match
            return acc
          }, {})
        }
      }

      // Enrich notifications with related data
      for (const notification of notifications) {
        const enriched = { ...notification }

        if (notification.tournament_id && tournamentsData[notification.tournament_id]) {
          enriched.tournament = tournamentsData[notification.tournament_id]
        }

        if (notification.match_id && matchesData[notification.match_id]) {
          enriched.match = matchesData[notification.match_id]
        }

        enrichedNotifications.push(enriched)
      }
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      console.error("Error counting notifications:", countError)
    }

    // Get unread count
    const { count: unreadCount, error: unreadCountError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (unreadCountError) {
      console.error("Error counting unread notifications:", unreadCountError)
    }

    return NextResponse.json({
      success: true,
      notifications: enrichedNotifications,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (totalCount || 0) > offset + limit
      },
      unreadCount: unreadCount || 0
    })

  } catch (error) {
    console.error("Unexpected error in GET /api/notifications:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notification_ids, mark_all_read } = await request.json()

    if (mark_all_read) {
      // Mark all notifications as read for the user
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) {
        console.error("Error marking all notifications as read:", error)
        return NextResponse.json({
          success: false,
          error: "Failed to mark notifications as read"
        }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json({
        error: 'Invalid request',
        details: 'Must provide either notification_ids array or mark_all_read boolean'
      }, { status: 400 })
    }

    // Mark specific notifications as read
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .in("id", notification_ids)
      .eq("user_id", user.id) // Security: ensure user can only update their own notifications

    if (error) {
      console.error("Error marking notifications as read:", error)
      return NextResponse.json({
        success: false,
        error: "Failed to mark notifications as read"
      }, { status: 500 })
    }

    // Get updated unread count
    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    return NextResponse.json({
      success: true,
      message: `${notification_ids.length} notification(s) marked as read`,
      unreadCount: unreadCount || 0
    })

  } catch (error) {
    console.error("Unexpected error in PATCH /api/notifications:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notification_ids, delete_all_read } = await request.json()

    if (delete_all_read) {
      // Delete all read notifications for the user
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("is_read", true)

      if (error) {
        console.error("Error deleting read notifications:", error)
        return NextResponse.json({
          success: false,
          error: "Failed to delete notifications"
        }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "All read notifications deleted" })
    }

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json({
        error: 'Invalid request',
        details: 'Must provide either notification_ids array or delete_all_read boolean'
      }, { status: 400 })
    }

    // Delete specific notifications
    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", notification_ids)
      .eq("user_id", user.id) // Security: ensure user can only delete their own notifications

    if (error) {
      console.error("Error deleting notifications:", error)
      return NextResponse.json({
        success: false,
        error: "Failed to delete notifications"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${notification_ids.length} notification(s) deleted`
    })

  } catch (error) {
    console.error("Unexpected error in DELETE /api/notifications:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}
