"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mail, X, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { resendVerificationEmail } from "@/lib/actions"

export default function VerificationBanner() {
  const [user, setUser] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      // Show banner if user is signed in but email not confirmed
      if (user && !user.email_confirmed_at) {
        setIsVisible(true)
      }
    }

    getUser()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        setIsVisible(!session.user.email_confirmed_at)
      }
      if (event === "SIGNED_OUT") {
        setUser(null)
        setIsVisible(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleResendEmail = async () => {
    if (!user?.email) return

    setIsResending(true)
    setMessage("")

    try {
      const result = await resendVerificationEmail(user.email)
      if (result.success) {
        setMessage("Verification email sent!")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Failed to send email")
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      setMessage("Failed to send email")
      setTimeout(() => setMessage(""), 3000)
    } finally {
      setIsResending(false)
    }
  }

  if (!isVisible || !user) return null

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Mail className="w-5 h-5 text-yellow-400" />
          <div className="flex-1">
            <p className="text-sm text-yellow-200">
              <span className="font-medium">Verify your email address</span>
              {message ? (
                <span className="ml-2 text-green-400">{message}</span>
              ) : (
                <span className="ml-1">to access all features</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            size="sm"
            variant="ghost"
            className="text-yellow-200 hover:text-white hover:bg-yellow-500/20"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend email"
            )}
          </Button>

          <Button
            onClick={() => setIsVisible(false)}
            size="sm"
            variant="ghost"
            className="text-yellow-200 hover:text-white hover:bg-yellow-500/20 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
