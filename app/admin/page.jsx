"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [disputes, setDisputes] = useState([])
  const [users, setUsers] = useState([])
  const [matchResults, setMatchResults] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadAdminData() {
      console.log("[v0] Admin page loading...")

      const supabase = createClient()

      try {
        console.log("[v0] Getting user data...")
        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser()

        console.log("[v0] User data result:", { userData: !!userData, userError: !!userError })

        if (userError || !userData.user) {
          console.log("[v0] No user found, redirecting to login")
          router.push("/auth/login")
          return
        }

        const currentUser = userData.user
        setUser(currentUser)

        console.log("[v0] User found:", currentUser.id, currentUser.email)

        const adminUserIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS
          ? process.env.NEXT_PUBLIC_ADMIN_USER_IDS.split(",").map((id) => id.trim())
          : []

        console.log("[v0] Environment check - NODE_ENV:", process.env.NODE_ENV)
        console.log("[v0] Admin check - User ID:", currentUser.id)
        console.log("[v0] Admin check - User email:", currentUser.email)
        console.log("[v0] Admin check - Admin IDs from env:", adminUserIds)

        // Check if user is admin with multiple fallback methods
        const isAdminById = adminUserIds.includes(currentUser.id)
        const isAdminByEmail = currentUser.email?.endsWith("@admin.com")
        const isDevMode = process.env.NODE_ENV === "development"

        console.log("[v0] Admin check - By ID:", isAdminById)
        console.log("[v0] Admin check - By email:", isAdminByEmail)
        console.log("[v0] Admin check - Dev mode:", isDevMode)

        const isAdmin = isAdminById || isAdminByEmail || isDevMode

        console.log("[v0] Admin check - Final result:", isAdmin)

        if (!isAdmin) {
          console.log("[v0] Access denied - user is not admin")
          setError("access_denied")
          setLoading(false)
          return
        }

        console.log("[v0] Admin access granted, fetching data...")

        console.log("[v0] Checking if tables exist...")
        const { error: tableCheckError } = await supabase.from("tournaments").select("id").limit(1)

        console.log("[v0] Table check result:", { error: !!tableCheckError })

        if (tableCheckError && tableCheckError.message.includes("does not exist")) {
          // Tables don't exist, use fallback data
          setTournaments([])
          setDisputes([])
          setUsers([])
          setMatchResults([])
        } else {
          // Fetch all tournaments
          const { data: tournamentsData } = await supabase
            .from("tournaments")
            .select(`
              *,
              profiles:organizer_id (username, full_name),
              tournament_participants (count)
            `)
            .order("created_at", { ascending: false })

          setTournaments(tournamentsData || [])

          // Fetch all disputes
          const { data: disputesData } = await supabase
            .from("match_disputes")
            .select(`
              *,
              matches (
                id,
                round,
                match_number,
                tournament_id,
                tournaments (title, game)
              ),
              disputed_by_profile:disputed_by (username, full_name, email)
            `)
            .order("created_at", { ascending: false })

          setDisputes(disputesData || [])

          // Fetch all match results
          const { data: resultsData } = await supabase
            .from("match_results")
            .select(`
              *,
              matches (
                id,
                round,
                match_number,
                tournament_id,
                tournaments (title, game)
              ),
              submitted_by_profile:submitted_by (username, full_name, email)
            `)
            .order("submitted_at", { ascending: false })
            .limit(50)

          setMatchResults(resultsData || [])

          // Fetch user profiles
          const { data: usersData } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100)

          setUsers(usersData || [])
        }
      } catch (err) {
        console.error("[v0] Admin dashboard error details:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        })

        if (err.message?.includes("JWT")) {
          console.log("[v0] JWT error, redirecting to login")
          router.push("/auth/login")
          return
        }

        console.log("[v0] Non-JWT error, setting error state")
        setError("system_error")
      }

      setLoading(false)
    }

    loadAdminData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    )
  }

  if (error === "access_denied") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
            <div className="text-red-400 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-slate-300 mb-6">You don't have permission to access the admin dashboard.</p>
            <div className="text-sm text-slate-400 mb-6">
              <p>User ID: {user?.id}</p>
              <p>Email: {user?.email}</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error === "system_error") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
            <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">System Error</h1>
            <p className="text-slate-300 mb-6">
              There was an error loading the admin dashboard. Please try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors mr-4"
            >
              Retry
            </button>
            <button
              onClick={() => window.history.back()}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="container mx-auto px-4">
        <AdminDashboard
          tournaments={tournaments}
          disputes={disputes}
          users={users}
          matchResults={matchResults}
          currentUser={user}
        />
      </div>
    </div>
  )
}
