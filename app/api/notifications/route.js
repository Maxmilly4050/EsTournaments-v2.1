import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
<<<<<<< HEAD
    // Create authenticated Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
=======
    const supabase = createClient()
>>>>>>> 718c315 (Bracket UI fix)

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
<<<<<<< HEAD
        created_at,
        scheduled_for
=======
        scheduled_for,
        created_at,
        tournament:tournaments(id, name),
        match:matches(id, round, match_number)
>>>>>>> 718c315 (Bracket UI fix)
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
        const enrichedNotification = { ...notification }

        if (notification.tournament_id && tournamentsData[notification.tournament_id]) {
          enrichedNotification.tournaments = tournamentsData[notification.tournament_id]
        }

        if (notification.match_id && matchesData[notification.match_id]) {
          enrichedNotification.matches = matchesData[notification.match_id]
        }

        enrichedNotifications.push(enrichedNotification)
      }
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (countError) {
      console.error("Error counting unread notifications:", countError)
      return NextResponse.json({
        success: false,
        error: "Failed to count unread notifications"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        notifications: enrichedNotifications || [],
        unread_count: unreadCount || 0,
        total_fetched: enrichedNotifications?.length || 0
      }
    })

  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
<<<<<<< HEAD
    // Create authenticated Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
=======
    const supabase = createClient()
>>>>>>> 718c315 (Bracket UI fix)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids, mark_all_read } = body

    if (mark_all_read) {
      // Mark all notifications as read for the user
<<<<<<< HEAD
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          is_read: true
        })
        .eq('user_id', user.id)
        .eq('is_read', false)
=======
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false)
>>>>>>> 718c315 (Bracket UI fix)

      if (error) {
        console.error("Error marking all notifications as read:", error)
        return NextResponse.json({
          success: false,
          error: "Failed to mark all notifications as read"
        }, { status: 500 })
      }

<<<<<<< HEAD
      // Get updated unread count after marking all as read
      const { count: unreadCount, error: countError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (countError) {
        console.error('Error getting unread count:', countError)
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
        data: {
          unread_count: unreadCount || 0
        }
      })
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          is_read: true
        })
        .eq('user_id', user.id)
        .in('id', notification_ids)

      if (updateError) {
        console.error('Error marking notifications as read:', updateError)
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
      }

      // Get updated unread count after marking specific notifications as read
      const { count: unreadCount, error: countError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (countError) {
        console.error('Error getting unread count:', countError)
      }

      return NextResponse.json({
        success: true,
        message: `${notification_ids.length} notification(s) marked as read`,
        data: {
          unread_count: unreadCount || 0
        }
      })
    } else {
      return NextResponse.json({
        error: 'Invalid request',
        details: 'Must provide either notification_ids array or mark_all_read boolean'
=======
      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: "notification_ids must be a non-empty array"
>>>>>>> 718c315 (Bracket UI fix)
      }, { status: 400 })
    }

    // Mark specific notifications as read
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .in("id", notification_ids)

    if (error) {
      console.error("Error marking notifications as read:", error)
      return NextResponse.json({
        success: false,
        error: "Failed to mark notifications as read"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${notification_ids.length} notifications marked as read`
    })

  } catch (error) {
    console.error("Error in notifications PATCH API:", error)
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

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")

    if (!notificationId) {
      return NextResponse.json({
        success: false,
        error: "notification id is required"
      }, { status: 400 })
    }

    // Delete the notification
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("id", notificationId)

    if (error) {
      console.error("Error deleting notification:", error)
      return NextResponse.json({
        success: false,
        error: "Failed to delete notification"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully"
    })

  } catch (error) {
    console.error("Error in notifications DELETE API:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

// DELETE /api/notifications - Delete individual notifications
export async function DELETE(request) {
  try {
    // Create authenticated Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids } = body

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json({
        error: 'Invalid request',
        details: 'Must provide notification_ids array with at least one ID'
      }, { status: 400 })
    }

    // Delete specific notifications (only user's own notifications)
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .in('id', notification_ids)

    if (deleteError) {
      console.error('Error deleting notifications:', deleteError)
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
    }

    // Get updated unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (countError) {
      console.error('Error getting unread count:', countError)
    }

    return NextResponse.json({
      success: true,
      message: `${notification_ids.length} notification(s) deleted`,
      data: {
        unread_count: unreadCount || 0
      }
    })

  } catch (error) {
    console.error('Error in notifications DELETE API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
