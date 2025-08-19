import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { NotificationService } from "@/lib/notification-service"

export async function GET(request) {
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
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Notifications API - Authentication failed:", authError?.message || "Auth session missing!")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Notifications API - User authenticated:", user.id)
    const notificationService = new NotificationService()
    const notifications = await notificationService.getUserNotifications(user.id)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("[v0] Notifications API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
