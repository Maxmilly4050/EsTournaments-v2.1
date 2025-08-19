"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle cookie setting errors in server actions
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // Handle cookie removal errors in server actions
        }
      },
    },
  })
}

export async function signIn(prevState, formData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createSupabaseServerClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true, redirect: "/tournaments" }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState, formData) {
  // Check if formData is valid
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const username = formData.get("username")
  const fullName = formData.get("fullName")
  const phoneNumber = formData.get("phoneNumber")

  // Validate required fields
  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createSupabaseServerClient()

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        data: {
          username: username?.toString(),
          full_name: fullName?.toString(),
          phone_number: phoneNumber?.toString(),
        },
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    return {
      success: "Account created! Please check your email and click the confirmation link to activate your account.",
      requiresVerification: true,
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signInWithGoogle() {
  const supabase = createSupabaseServerClient()

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      console.error("Google sign-in error:", error)
      return { error: error.message }
    }

    return { url: data.url }
  } catch (error) {
    console.error("Google OAuth error:", error)
    return { error: "Failed to initialize Google sign-in" }
  }
}

export async function signOut() {
  const supabase = createSupabaseServerClient()

  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function resendVerificationEmail(email) {
  try {
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error }
    }

    return { success: data.message }
  } catch (error) {
    console.error("Resend verification error:", error)
    return { error: "Failed to resend verification email. Please try again." }
  }
}

export async function resendEmailChangeVerification() {
  try {
    const response = await fetch("/api/auth/resend-email-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error }
    }

    return { success: data.message, pendingEmail: data.pendingEmail }
  } catch (error) {
    console.error("Resend email change verification error:", error)
    return { error: "Failed to resend email change verification. Please try again." }
  }
}
