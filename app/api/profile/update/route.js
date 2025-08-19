import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateProfileUpdate } from "@/lib/validation-schemas"
import { withSecurity, SecurityMiddleware } from "@/lib/security-middleware"
import { withEmailVerification } from "@/lib/email-verification-middleware"

async function updateProfileHandler(request) {
  try {
    const body = await request.json()
    const { updates, reason } = body

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Invalid updates data" }, { status: 400 })
    }

    // Validate and sanitize input
    const validation = validateProfileUpdate(updates)
    if (!validation.isValid) {
      SecurityMiddleware.logSecurityEvent("VALIDATION_FAILURE", {
        userId: request.user?.id,
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

    const supabase = createClient()
    const userId = request.user.id

    // Check if user exists and get current profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (fetchError || !currentProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Special handling for gamer tag changes
    if (validation.sanitizedData.gamer_tag && validation.sanitizedData.gamer_tag !== currentProfile.gamer_tag) {
      // Check cooldown period
      if (currentProfile.last_gamer_tag_change) {
        const lastChange = new Date(currentProfile.last_gamer_tag_change)
        const thirtyDaysLater = new Date(lastChange.getTime() + 30 * 24 * 60 * 60 * 1000)

        if (new Date() < thirtyDaysLater) {
          return NextResponse.json({ error: "Gamer tag can only be changed once every 30 days" }, { status: 400 })
        }
      }

      // Check if gamer tag is already taken
      const { data: existingTag } = await supabase
        .from("profiles")
        .select("id")
        .eq("gamer_tag", validation.sanitizedData.gamer_tag)
        .neq("id", userId)
        .single()

      if (existingTag) {
        return NextResponse.json({ error: "Gamer tag is already taken" }, { status: 400 })
      }

      // Add gamer tag change timestamp
      validation.sanitizedData.last_gamer_tag_change = new Date().toISOString()
    }

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ...validation.sanitizedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Profile update error:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    // Log profile changes for audit trail
    const changedFields = Object.keys(validation.sanitizedData)
    if (changedFields.length > 0) {
      const logPromises = changedFields.map((field) => {
        const oldValue = currentProfile[field]
        const newValue = validation.sanitizedData[field]

        if (oldValue !== newValue) {
          return supabase.from("profile_edit_history").insert({
            user_id: userId,
            field_name: field,
            old_value: oldValue ? String(oldValue) : null,
            new_value: newValue ? String(newValue) : null,
            edited_by: userId,
            edit_reason: reason || "User profile update",
          })
        }
        return Promise.resolve()
      })

      await Promise.all(logPromises)
    }

    SecurityMiddleware.logSecurityEvent("PROFILE_UPDATED", {
      userId,
      changedFields,
      ip: request.ip,
      userAgent: request.userAgent,
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      updatedFields: changedFields,
    })
  } catch (error) {
    console.error("Profile update handler error:", error)
    SecurityMiddleware.logSecurityEvent("PROFILE_UPDATE_ERROR", {
      userId: request.user?.id,
      error: error.message,
      ip: request.ip,
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withEmailVerification(
  withSecurity(updateProfileHandler, {
    requireAuth: true,
    rateLimit: {
      maxRequests: 5,
      windowMs: 60000, // 5 requests per minute
    },
    csrfProtection: true,
  }),
)
