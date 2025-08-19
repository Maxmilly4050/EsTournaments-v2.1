import { NextResponse } from "next/server"
import { verificationService } from "@/lib/verification-service"

export async function POST(request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    // Verify email token
    const result = await verificationService.verifyEmail(token)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      message: result.message,
    })
  } catch (error) {
    console.error("Error in email verification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
