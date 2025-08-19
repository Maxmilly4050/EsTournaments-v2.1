import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Middleware utility to check if user's email is verified
 * Used in API routes that require email verification
 */
export async function requireEmailVerification(request) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        user: null,
      }
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      return {
        error: NextResponse.json(
          {
            error: "Email verification required",
            requiresVerification: true,
            message: "Please verify your email address to access this feature",
          },
          { status: 403 },
        ),
        user: null,
      }
    }

    return { error: null, user }
  } catch (error) {
    console.error("Email verification middleware error:", error)
    return {
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      user: null,
    }
  }
}

/**
 * Higher-order function to wrap API handlers with email verification
 */
export function withEmailVerification(handler) {
  return async (request, ...args) => {
    const { error, user } = await requireEmailVerification(request)

    if (error) {
      return error
    }

    // Add user to request object for convenience
    request.user = user

    return handler(request, ...args)
  }
}

/**
 * Check email verification status for client-side use
 */
export async function checkEmailVerificationStatus(userId) {
  try {
    const supabase = createClient()

    const { data: user, error } = await supabase.auth.getUser()

    if (error || !user.user) {
      return { verified: false, error: "User not found" }
    }

    return {
      verified: !!user.user.email_confirmed_at,
      email: user.user.email,
      verifiedAt: user.user.email_confirmed_at,
    }
  } catch (error) {
    console.error("Error checking email verification status:", error)
    return { verified: false, error: "Failed to check verification status" }
  }
}
