import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/notifications - Fetch user notifications
export async function GET(request) {
  try {
    // Create authenticated Supabase client
    const cookieStore = cookies()
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

    // Parse query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const unreadOnly = url.searchParams.get('unread_only') === 'true'

    // Build query - fetch notifications without joins to avoid PostgREST relationship issues
    let query = supabase
      .from('notifications')
      .select(`
        id,
        tournament_id,
        match_id,
        type,
        title,
        message,
        is_read,
        created_at,
        scheduled_for
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error: notificationError } = await query

    if (notificationError) {
      console.error('Error fetching notifications:', notificationError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
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
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (countError) {
      console.error('Error getting unread count:', countError)
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
    console.error('Error in notifications API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request) {
  try {
    // Create authenticated Supabase client
    const cookieStore = cookies()
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
    const { notification_ids, mark_all_read } = body

    if (mark_all_read) {
      // Mark all notifications as read for the user
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (updateError) {
        console.error('Error marking all notifications as read:', updateError)
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('id', notification_ids)

      if (updateError) {
        console.error('Error marking notifications as read:', updateError)
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `${notification_ids.length} notification(s) marked as read`
      })
    } else {
      return NextResponse.json({
        error: 'Invalid request',
        details: 'Must provide either notification_ids array or mark_all_read boolean'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in notifications PATCH API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
