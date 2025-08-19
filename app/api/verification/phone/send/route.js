import { NextResponse } from "next/server"
import { verificationService } from "@/lib/verification-service"
import { validateField } from "@/lib/validation-schemas"
import { withSecurity, SecurityMiddleware } from "@/lib/security-middleware"

async function sendPhoneVerificationHandler(request) {
  try {
    const body = await request.json()
    const { phoneNumber } = body

    // Validate phone number
    const phoneValidation = validateField("phoneNumber", phoneNumber)
    if (!phoneValidation.isValid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 })
    }

    const userId = request.user.id

    // Send verification SMS
    const result = await verificationService.sendPhoneVerification(userId, phoneValidation.sanitizedValue)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    SecurityMiddleware.logSecurityEvent("PHONE_VERIFICATION_SENT", {
      userId,
      phoneNumber: phoneValidation.sanitizedValue,
      ip: request.ip,
    })

    return NextResponse.json({
      message: result.message,
      // Include OTP for testing - remove in production
      otp: result.otp,
    })
  } catch (error) {
    console.error("Error in phone verification send:", error)
    SecurityMiddleware.logSecurityEvent("PHONE_VERIFICATION_ERROR", {
      userId: request.user?.id,
      error: error.message,
      ip: request.ip,
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withSecurity(sendPhoneVerificationHandler, {
  requireAuth: true,
  rateLimit: {
    maxRequests: 3,
    windowMs: 300000, // 3 requests per 5 minutes
  },
  csrfProtection: true,
})
