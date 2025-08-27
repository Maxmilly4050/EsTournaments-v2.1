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
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      total_fetched: notifications?.length || 0,
      has_more: (notifications?.length || 0) === limit
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
        error: "Invalid request - notification_ids array required"
      }, { status: 400 })
    }

    // Mark specific notifications as read
    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .in("id", notification_ids)
      .eq("user_id", user.id) // Ensure user can only update their own notifications

    if (updateError) {
      console.error("Error marking notifications as read:", updateError)
      return NextResponse.json({
        success: false,
        error: "Failed to mark notifications as read"
      }, { status: 500 })
    }

    // Get updated unread count
    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_read", false)

    return NextResponse.json({
      success: true,
      message: `${notification_ids.length} notification(s) marked as read`,
      unread_count: unreadCount || 0
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

    const body = await request.json()
    const { notification_ids, delete_all_read } = body

    if (delete_all_read) {
      // Delete all read notifications for the user
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("is_read", true)

      if (error) {
        console.error("Error deleting all read notifications:", error)
        return NextResponse.json({
          success: false,
          error: "Failed to delete read notifications"
        }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "All read notifications deleted" })
    }

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid request - notification_ids array required"
      }, { status: 400 })
    }

    // Delete specific notifications
    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .in("id", notification_ids)
      .eq("user_id", user.id) // Ensure user can only delete their own notifications

    if (deleteError) {
      console.error("Error deleting notifications:", deleteError)
      return NextResponse.json({
        success: false,
        error: "Failed to delete notifications"
      }, { status: 500 })
    }

    // Get updated unread count
    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_read", false)

    return NextResponse.json({
      success: true,
      message: `${notification_ids.length} notification(s) deleted`,
      unread_count: unreadCount || 0
    })
  } catch (error) {
    console.error("Unexpected error in DELETE /api/notifications:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}
