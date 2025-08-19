import { NextResponse } from "next/server"
import { adminService } from "@/lib/admin-service"
import { validateProfileUpdate } from "@/lib/validation-schemas"
import { withSecurity, SecurityMiddleware } from "@/lib/security-middleware"

async function adminUpdateProfileHandler(request) {
  try {
    const body = await request.json()
    const { userId, updates, reason } = body

    if (!userId || !updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate and sanitize input
    const validation = validateProfileUpdate(updates)
    if (!validation.isValid) {
      SecurityMiddleware.logSecurityEvent("ADMIN_VALIDATION_FAILURE", {
        adminId: request.user.id,
        targetUserId: userId,
        errors: validation.errors,
        ip: request.ip,
      })

      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 },
      )
    }

    // Update profile via admin service
    const result = await adminService.updateUserProfile(
      userId,
      validation.sanitizedData,
      request.user.id,
      reason || "Admin profile update",
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    SecurityMiddleware.logSecurityEvent("ADMIN_PROFILE_UPDATE", {
      adminId: request.user.id,
      targetUserId: userId,
      updatedFields: Object.keys(validation.sanitizedData),
      reason,
      ip: request.ip,
      userAgent: request.userAgent,
    })

    return NextResponse.json({
      message: result.message,
    })
  } catch (error) {
    console.error("Admin profile update error:", error)
    SecurityMiddleware.logSecurityEvent("ADMIN_PROFILE_UPDATE_ERROR", {
      adminId: request.user?.id,
      error: error.message,
      ip: request.ip,
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withSecurity(adminUpdateProfileHandler, {
  requireAuth: true,
  requireAdmin: true,
  rateLimit: {
    maxRequests: 20,
    windowMs: 60000, // 20 requests per minute for admins
  },
  csrfProtection: true,
})
