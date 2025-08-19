import { NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { withEmailVerification } from "@/lib/email-verification-middleware"

async function resendEmailChangeHandler(request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })
    const user = request.user

    // Get pending email from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("pending_email")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.pending_email) {
      return NextResponse.json({ error: "No pending email change found" }, { status: 400 })
    }

    // Use Supabase's resend API for email change verification
    const { error } = await supabase.auth.resend({
      type: "email_change",
      email: profile.pending_email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      console.error("Resend email change error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: `Email change verification resent to ${profile.pending_email}`,
      pendingEmail: profile.pending_email,
    })
  } catch (error) {
    console.error("Resend email change API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withEmailVerification(resendEmailChangeHandler)
