import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function updateSession(request) {
  // If Supabase is not configured, just continue without auth
  if (!isSupabaseConfigured) {
    return NextResponse.next({
      request,
    })
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value
      },
      set(name, value, options) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name, options) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: "",
          ...options,
        })
      },
    },
  })

  // Check if this is an auth callback
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
    // Redirect to home page after successful auth
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()

  // Protected routes - redirect to login if not authenticated
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/sign-up") ||
    request.nextUrl.pathname === "/auth/callback"

  const isVerificationRoute = request.nextUrl.pathname === "/auth/verify-email"

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")

  const isStrictlyProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    isAdminRoute ||
    (request.nextUrl.pathname.startsWith("/tournaments") && request.nextUrl.pathname.includes("/join"))

  const isMyTournamentsRoute = request.nextUrl.pathname.startsWith("/my-tournaments")

  const isTournamentCreationRoute = request.nextUrl.pathname.startsWith("/tournaments/create")

  const isProfileRoute = request.nextUrl.pathname.startsWith("/profile")

  if (
    (isStrictlyProtectedRoute || isTournamentCreationRoute || isProfileRoute) &&
    !isAuthRoute &&
    !isVerificationRoute
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      const redirectUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    if (isStrictlyProtectedRoute && session.user && !session.user.email_confirmed_at) {
      const redirectUrl = new URL("/auth/verify-email", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Admin role check for admin routes
    if (isAdminRoute && session.user) {
      const adminUserIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS
        ? process.env.NEXT_PUBLIC_ADMIN_USER_IDS.split(",").map((id) => id.trim())
        : []

      const isAdminById = adminUserIds.includes(session.user.id)
      const isAdminByEmail = session.user.email?.endsWith("@admin.com")

      const isAdmin = isAdminById || isAdminByEmail

      if (!isAdmin) {
        // Redirect non-admin users to home page
        const redirectUrl = new URL("/", request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  if (isMyTournamentsRoute && !isAuthRoute && !isVerificationRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      const redirectUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}
