import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { withEmailVerification } from "@/lib/email-verification-middleware"
import { validateField } from "@/lib/validation-schemas"

async function changeEmailHandler(request) {
  try {
    const { newEmail } = await request.json()
    const user = request.user

    // Validate new email
    const emailValidation = validateField("email", newEmail)
    if (!emailValidation.isValid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 })
    }

    // Check if new email is different from current
    if (emailValidation.sanitizedValue === user.email) {
      return NextResponse.json({ error: "New email must be different from current email" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if new email is already in use
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(emailValidation.sanitizedValue)
    if (existingUser.user && existingUser.user.id !== user.id) {
      return NextResponse.json({ error: "Email address is already in use" }, { status: 400 })
    }

    // Store pending email change in profiles table
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        pending_email: emailValidation.sanitizedValue,
        pending_email_requested_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error storing pending email:", updateError)
      return NextResponse.json({ error: "Failed to initiate email change" }, { status: 500 })
    }

    // Send verification email to new address
    const { error: emailError } = await supabase.auth.updateUser({
      email: emailValidation.sanitizedValue,
    })

    if (emailError) {
      console.error("Error sending verification email:", emailError)
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
    }

    return NextResponse.json({
      message:
        "Verification email sent to new address. Your current email will remain active until the new one is verified.",
      pendingEmail: emailValidation.sanitizedValue,
    })
  } catch (error) {
    console.error("Email change error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withEmailVerification(changeEmailHandler)
