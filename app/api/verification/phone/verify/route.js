import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verificationService } from "@/lib/verification-service"

export async function POST(request) {
  try {
    const { otpCode } = await request.json()

    if (!otpCode) {
      return NextResponse.json({ error: "Verification code is required" }, { status: 400 })
    }

    // Get authenticated user
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify phone OTP
    const result = await verificationService.verifyPhone(user.id, otpCode)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      message: result.message,
    })
  } catch (error) {
    console.error("Error in phone verification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
