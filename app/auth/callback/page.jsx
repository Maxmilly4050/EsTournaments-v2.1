import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallback({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const supabase = createClient()

  if (resolvedSearchParams.code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(resolvedSearchParams.code)

      if (error) {
        console.error("Error exchanging code for session:", error)
        redirect("/auth/login?error=callback_error")
      }

      if (data.session && data.user) {
        // Check if profile exists, if not create it
        const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

        if (!existingProfile) {
          // Create profile from user metadata
          const { error: profileError } = await supabase.from("profiles").insert([
            {
              id: data.user.id,
              username: data.user.user_metadata?.username || data.user.email?.split("@")[0],
              full_name: data.user.user_metadata?.full_name || "",
              phone_number: data.user.user_metadata?.phone_number || "",
              email: data.user.email,
            },
          ])

          if (profileError) {
            console.error("Profile creation error:", profileError)
          }
        }

        if (data.user.email_confirmed_at) {
          redirect("/?verified=true")
        } else {
          redirect("/auth/verify-email")
        }
      } else {
        redirect("/auth/login?error=session_error")
      }
    } catch (error) {
      console.error("Error in auth callback:", error)
      redirect("/auth/login?error=callback_error")
    }
  }

  // If no code parameter, redirect to login
  redirect("/auth/login")
}
