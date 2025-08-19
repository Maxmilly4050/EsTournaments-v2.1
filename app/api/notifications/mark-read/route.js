import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { NotificationService } from "@/lib/notification-service"

export async function POST(request) {
  try {
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
      },
    )

    const { notificationIds } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Mark read API - Authentication failed:", authError?.message || "No user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Mark read API - User authenticated:", user.id)
    const notificationService = new NotificationService()
    await notificationService.markAsRead(notificationIds, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Mark read API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
