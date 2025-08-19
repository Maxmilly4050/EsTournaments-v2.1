"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mail, RefreshCw, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { resendVerificationEmail, resendEmailChangeVerification } from "@/lib/actions"

export default function VerifyEmailPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Get current user and profile
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Get profile to check for pending email changes
        const { data: profileData } = await supabase.from("profiles").select("pending_email").eq("id", user.id).single()
        setProfile(profileData)

        // If user is already verified, redirect to home
        if (user.email_confirmed_at) {
          router.push("/")
        }
      }
    }

    getUser()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        router.push("/?verified=true")
      }
      if (event === "SIGNED_OUT") {
        router.push("/auth/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleResendEmail = async () => {
    if (!user?.email) return

    setIsResending(true)
    setResendMessage("")

    try {
      let result

      // Check if there's a pending email change
      if (profile?.pending_email) {
        result = await resendEmailChangeVerification()
      } else {
        result = await resendVerificationEmail(user.email)
      }

      if (result.success) {
        setResendMessage(result.success)
      } else {
        setResendMessage(result.error || "Failed to resend email")
      }
    } catch (error) {
      setResendMessage("Failed to resend email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    setIsChecking(true)

    try {
      // Refresh the session to get updated user data
      const {
        data: { session },
      } = await supabase.auth.refreshSession()

      if (session?.user?.email_confirmed_at) {
        router.push("/?verified=true")
      } else {
        setResendMessage("Email not yet verified. Please check your inbox and click the verification link.")
      }
    } catch (error) {
      setResendMessage("Failed to check verification status. Please try again.")
    } finally {
      setIsChecking(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const displayEmail = profile?.pending_email || user.email
  const isEmailChange = !!profile?.pending_email

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-white">
              {isEmailChange ? "Verify your new email" : "Verify your email"}
            </h1>
            <p className="text-gray-400 text-lg">
              {isEmailChange ? "We sent a verification link to your new email" : "We sent a verification link to"}
            </p>
            <p className="text-white font-medium">{displayEmail}</p>
            {isEmailChange && (
              <p className="text-sm text-yellow-400">
                Your current email ({user.email}) remains active until verification is complete
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">Check your email</p>
                <p>Click the verification link in the email we sent to activate your account.</p>
              </div>
            </div>
          </div>

          {resendMessage && (
            <div
              className={`p-4 rounded-lg border ${
                resendMessage.includes("sent") || resendMessage.includes("success")
                  ? "bg-green-500/10 border-green-500/50 text-green-400"
                  : "bg-red-500/10 border-red-500/50 text-red-400"
              }`}
            >
              {resendMessage}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-medium rounded-lg h-[60px]"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "I've verified my email"
              )}
            </Button>

            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
              className="w-full bg-slate-800 border-slate-600 text-white hover:bg-slate-700 py-6 text-lg font-medium rounded-lg h-[60px]"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="text-sm text-gray-400">
            <p>Didn't receive the email? Check your spam folder or</p>
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="text-blue-400 hover:underline font-medium"
            >
              try resending it
            </button>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <p className="text-sm text-gray-400 mb-2">Wrong email address?</p>
            <Button onClick={handleSignOut} variant="ghost" className="text-gray-400 hover:text-white">
              Sign out and try again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
