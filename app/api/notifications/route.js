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

    // Build query
    let query = supabase
      .from("notifications")
      .select(`
        id,
        type,
        title,
        message,
        data,
        is_read,
        scheduled_for,
        created_at,
        tournament:tournaments(id, name),
        match:matches(id, round, match_number)
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
        notifications: notifications || [],
        unread_count: unreadCount || 0,
        total_fetched: notifications?.length || 0
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
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids, mark_all_read } = body

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
          error: "Failed to mark all notifications as read"
        }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: "notification_ids must be a non-empty array"
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
