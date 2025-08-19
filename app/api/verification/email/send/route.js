import { NextResponse } from "next/server"
import { verificationService } from "@/lib/verification-service"
import { validateField } from "@/lib/validation-schemas"
import { withSecurity, SecurityMiddleware } from "@/lib/security-middleware"

async function sendEmailVerificationHandler(request) {
  try {
    console.log("[v0] Email verification API called")

    const body = await request.json()
    const { email } = body

    console.log("[v0] Request body:", { email })
    console.log("[v0] User from request:", request.user?.id)

    // Validate email
    const emailValidation = validateField("email", email)
    if (!emailValidation.isValid) {
      console.log("[v0] Email validation failed:", emailValidation.error)
      return NextResponse.json({ error: emailValidation.error }, { status: 400 })
    }

    const userId = request.user.id
    console.log("[v0] Calling verification service for user:", userId, "email:", emailValidation.sanitizedValue)

    // Send verification email
    const result = await verificationService.sendEmailVerification(userId, emailValidation.sanitizedValue)

    console.log("[v0] Verification service result:", result)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    SecurityMiddleware.logSecurityEvent("EMAIL_VERIFICATION_SENT", {
      userId,
      email: emailValidation.sanitizedValue,
      ip: request.ip,
    })

    return NextResponse.json({
      message: result.message,
      // Include token for testing - remove in production
      token: result.token,
    })
  } catch (error) {
    console.error("Error in email verification send:", error)
    SecurityMiddleware.logSecurityEvent("EMAIL_VERIFICATION_ERROR", {
      userId: request.user?.id,
      error: error.message,
      ip: request.ip,
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withSecurity(sendEmailVerificationHandler, {
  requireAuth: true,
  rateLimit: {
    maxRequests: 3,
    windowMs: 300000, // 3 requests per 5 minutes
  },
  csrfProtection: true,
})
