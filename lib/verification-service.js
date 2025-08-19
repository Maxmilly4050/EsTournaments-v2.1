import { createClient } from "@/lib/supabase/client"

class VerificationService {
  constructor() {
    this.supabase = createClient()
  }

  // Email Verification Methods
  async sendEmailVerification(userId, email) {
    try {
      console.log("[v0] VerificationService.sendEmailVerification called", { userId, email })
      console.log("[v0] Environment NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL)

      const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`
      console.log("[v0] Using redirect URL:", redirectUrl)

      const { error } = await this.supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        console.error("[v0] Supabase resend error:", error)

        // Provide helpful error messages for common issues
        if (error.message.includes('SMTP') || error.message.includes('Email not configured')) {
          const helpfulError = new Error(
            "Email provider not configured. Please set up SMTP settings in your Supabase dashboard under Authentication > Settings > SMTP Settings. See EMAIL_SETUP_GUIDE.md for detailed instructions."
          )
          helpfulError.code = 'EMAIL_PROVIDER_NOT_CONFIGURED'
          throw helpfulError
        }

        if (error.message.includes('Invalid email')) {
          const helpfulError = new Error("Invalid email address provided.")
          helpfulError.code = 'INVALID_EMAIL'
          throw helpfulError
        }

        if (error.message.includes('rate limit')) {
          const helpfulError = new Error("Too many email requests. Please wait a few minutes before trying again.")
          helpfulError.code = 'RATE_LIMITED'
          throw helpfulError
        }

        throw error
      }

      console.log(`[v0] Email verification sent successfully to ${email}`)

      return {
        success: true,
        message: "Verification email sent successfully",
      }
    } catch (error) {
      console.error("Error sending email verification:", error)
      return {
        success: false,
        error: error.message || "Failed to send verification email",
      }
    }
  }

  async verifyEmail(token) {
    try {
      // This method is now mainly for manual token verification if needed
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        return {
          success: false,
          error: "User not authenticated",
        }
      }

      // Check if email is already confirmed
      if (user.email_confirmed_at) {
        return {
          success: true,
          message: "Email already verified",
        }
      }

      return {
        success: false,
        error: "Email verification pending",
      }
    } catch (error) {
      console.error("Error verifying email:", error)
      return {
        success: false,
        error: "Failed to verify email",
      }
    }
  }

  // Phone Verification Methods
  async sendPhoneVerification(userId, phoneNumber) {
    try {
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Delete any existing unverified OTP for this user
      await this.supabase.from("phone_verifications").delete().eq("user_id", userId).is("verified_at", null)

      // Store OTP in database
      const { error: insertError } = await this.supabase.from("phone_verifications").insert({
        user_id: userId,
        phone_number: phoneNumber,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      })

      if (insertError) throw insertError

      // In a real app, you would send SMS here
      // For now, we'll log the OTP for testing purposes
      console.log(`[v0] Phone verification OTP for ${phoneNumber}: ${otpCode}`)

      return {
        success: true,
        message: "Verification code sent to your phone",
        otp: otpCode, // Remove this in production
      }
    } catch (error) {
      console.error("Error sending phone verification:", error)
      return {
        success: false,
        error: "Failed to send verification code",
      }
    }
  }

  async verifyPhone(userId, otpCode) {
    try {
      // Find verification record
      const { data: verification, error: fetchError } = await this.supabase
        .from("phone_verifications")
        .select("*")
        .eq("user_id", userId)
        .is("verified_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (fetchError || !verification) {
        return {
          success: false,
          error: "No pending verification found",
        }
      }

      // Check if too many attempts
      if (verification.attempts >= 3) {
        return {
          success: false,
          error: "Too many failed attempts. Please request a new code.",
        }
      }

      // Check if token is expired
      if (new Date() > new Date(verification.expires_at)) {
        return {
          success: false,
          error: "Verification code has expired",
        }
      }

      // Check if OTP matches
      if (verification.otp_code !== otpCode) {
        // Increment attempts
        await this.supabase
          .from("phone_verifications")
          .update({
            attempts: verification.attempts + 1,
          })
          .eq("id", verification.id)

        return {
          success: false,
          error: "Invalid verification code",
        }
      }

      // Mark as verified
      const { error: updateError } = await this.supabase
        .from("phone_verifications")
        .update({
          verified_at: new Date().toISOString(),
        })
        .eq("id", verification.id)

      if (updateError) throw updateError

      // Update user profile
      const { error: profileError } = await this.supabase
        .from("profiles")
        .update({
          phone_number: verification.phone_number,
          phone_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", verification.user_id)

      if (profileError) throw profileError

      return {
        success: true,
        message: "Phone number verified successfully",
      }
    } catch (error) {
      console.error("Error verifying phone:", error)
      return {
        success: false,
        error: "Failed to verify phone number",
      }
    }
  }

  // Utility Methods
  async getVerificationStatus(userId) {
    try {
      const { data: profile, error } = await this.supabase
        .from("profiles")
        .select("email_verified, phone_verified, phone_number")
        .eq("id", userId)
        .single()

      if (error) throw error

      return {
        success: true,
        data: {
          emailVerified: profile.email_verified || false,
          phoneVerified: profile.phone_verified || false,
          hasPhoneNumber: !!profile.phone_number,
        },
      }
    } catch (error) {
      console.error("Error getting verification status:", error)
      return {
        success: false,
        error: "Failed to get verification status",
      }
    }
  }

  async resendVerification(userId, type) {
    try {
      if (type === "email") {
        const {
          data: { user },
        } = await this.supabase.auth.getUser()
        if (!user) throw new Error("User not authenticated")

        return await this.sendEmailVerification(userId, user.email)
      } else if (type === "phone") {
        // Get user's phone number from profile
        const { data: profile } = await this.supabase.from("profiles").select("phone_number").eq("id", userId).single()

        if (!profile?.phone_number) {
          return {
            success: false,
            error: "No phone number found",
          }
        }

        return await this.sendPhoneVerification(userId, profile.phone_number)
      }
    } catch (error) {
      console.error("Error resending verification:", error)
      return {
        success: false,
        error: "Failed to resend verification",
      }
    }
  }
}

export const verificationService = new VerificationService()
