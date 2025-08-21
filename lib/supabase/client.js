import { createBrowserClient } from "@supabase/ssr"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export const createClient = () => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using dummy client.")
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
        resend: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        update: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        delete: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      }),
    }
  }

  const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Extend session timeout to 4 hours (14400 seconds)
      sessionExpiry: 14400
    }
  })

  client.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") {
      console.log("Token refreshed automatically")
    }

    if (event === "SIGNED_OUT") {
      // Clear any cached data when user signs out
      console.log("User signed out, clearing cache")
    }

    if (event === "SIGNED_IN" && session?.user) {
      console.log("User signed in, email confirmed:", !!session.user.email_confirmed_at)
    }
  })

  return client
}

// Create a singleton instance of the Supabase client for Client Components
export const supabase = createClient()
