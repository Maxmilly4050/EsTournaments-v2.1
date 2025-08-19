"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { signUp, signInWithGoogle } from "@/lib/actions"

function SubmitButton({ isLoading }) {
  return (
    <Button
      type="submit"
      disabled={isLoading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-medium rounded-lg h-[60px]"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating account...
        </>
      ) : (
        "Create Account"
      )}
    </Button>
  )
}

function GoogleSignUpButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithGoogle()
      if (result?.url) {
        window.location.href = result.url
      } else if (result?.error) {
        console.error("Google sign-up error:", result.error)
        alert("Failed to sign up with Google. Please try again.")
      }
    } catch (error) {
      console.error("Google sign-up error:", error)
      alert("Failed to sign up with Google. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleGoogleSignUp}
      disabled={isLoading}
      variant="outline"
      className="w-full bg-slate-800 border-slate-600 text-white hover:bg-slate-700 py-6 text-lg font-medium rounded-lg h-[60px]"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </>
      )}
    </Button>
  )
}

export default function SignUpForm() {
  const router = useRouter()
  const [state, setState] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Handle successful signup
  useEffect(() => {
    if (state?.success) {
      router.push("/auth/login?message=Check your email to confirm your account")
    }
  }, [state, router])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setState(null)

    const formData = new FormData(event.target)

    try {
      const result = await signUp(null, formData)
      setState(result)
    } catch (error) {
      setState({ error: "An error occurred during sign up. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Create account</h1>
        <p className="text-lg text-gray-400">Join the tournament platform</p>
      </div>

      <div className="space-y-4">
        <GoogleSignUpButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-gray-400">Or continue with email</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {state?.error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">{state.error}</div>
        )}

        {state?.success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded">
            Account created! Check your email to confirm your account.
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="johndoe"
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300">
              Phone Number
            </label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="+1 (555) 123-4567"
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>
        </div>

        <SubmitButton isLoading={isLoading} />

        <div className="text-center text-gray-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  )
}
