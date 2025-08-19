import { NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { validateField } from "@/lib/validation-schemas"

export async function POST(request) {
  try {
    const { email } = await request.json()

    // Validate email
    const emailValidation = validateField("email", email)
    if (!emailValidation.isValid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Use Supabase's resend API for signup verification
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: emailValidation.sanitizedValue,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      console.error("Resend verification error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: "Verification email sent! Please check your inbox.",
    })
  } catch (error) {
    console.error("Resend verification API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
