import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Verify the email change token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "email_change",
    })

    if (error) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    if (data.user) {
      // Clear pending email from profiles table
      await supabase
        .from("profiles")
        .update({
          pending_email: null,
          pending_email_requested_at: null,
          email_verified: true,
        })
        .eq("id", data.user.id)

      return NextResponse.json({
        message: "Email change confirmed successfully",
        newEmail: data.user.email,
      })
    }

    return NextResponse.json({ error: "Failed to confirm email change" }, { status: 400 })
  } catch (error) {
    console.error("Email change confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
