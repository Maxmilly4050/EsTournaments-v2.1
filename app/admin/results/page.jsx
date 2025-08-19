import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { HostResultsDashboard } from "@/components/host-results-dashboard"
import Header from "@/components/header"

export default async function AdminResultsPage() {
  const supabase = createClient()
  let user = null
  let pendingMatches = []
  let error = null

  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      redirect("/auth/login")
    }
    user = userData.user

    // Check admin permissions
    const adminUserIds = process.env.ADMIN_USER_IDS ? process.env.ADMIN_USER_IDS.split(",").map((id) => id.trim()) : []
    const isAdminById = adminUserIds.includes(user.id)
    const isAdminByEmail = user.email?.endsWith("@admin.com")
    const isDevMode = process.env.NODE_ENV === "development"
    const isAdmin = isAdminById || isAdminByEmail || isDevMode

    if (!isAdmin) {
      error = "access_denied"
    } else {
      // Check if tables exist
      const { error: tableCheckError } = await supabase.from("matches").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        // Tables don't exist, use fallback data
        pendingMatches = []
      } else {
        // Fetch matches that have result submissions and need review
        const { data: matchesData } = await supabase
          .from("matches")
          .select(`
            id,
            round,
            match_number,
            player1_id,
            player2_id,
            winner_id,
            status,
            tournament_id,
            match_code,
            tournaments!inner(
              id,
              title,
              game,
              organizer_id
            ),
            player1:player1_id(
              id,
              username,
              full_name
            ),
            player2:player2_id(
              id,
              username,
              full_name
            )
          `)
          .eq("status", "pending")
          .not("player1_id", "is", null)
          .not("player2_id", "is", null)
          .order("created_at", { ascending: true })

        if (matchesData) {
          // For each match, get the result submissions
          const matchesWithResults = await Promise.all(
            matchesData.map(async (match) => {
              const { data: results } = await supabase
                .from("match_results")
                .select(`
                  id,
                  submitted_by,
                  screenshot_url,
                  score,
                  result_notes,
                  created_at,
                  profiles!inner(
                    username,
                    full_name
                  )
                `)
                .eq("match_id", match.id)
                .order("created_at", { ascending: true })

              return {
                ...match,
                results: results || [],
              }
            }),
          )

          // Filter to only matches that have at least one result submission
          pendingMatches = matchesWithResults.filter((match) => match.results.length > 0)
        }
      }
    }
  } catch (err) {
    console.error("Admin results error:", err)
    if (err.message?.includes("JWT")) {
      redirect("/auth/login")
    }
    error = "system_error"
  }

  if (error === "access_denied") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
            <div className="text-red-400 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-slate-300 mb-6">You don't have permission to access the results dashboard.</p>
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
            <p className="text-slate-300 mb-6">There was an error loading the results dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-900 pt-20 py-8">
        <div className="container mx-auto px-4">
          <HostResultsDashboard matches={pendingMatches} currentUser={user} />
        </div>
      </div>
    </>
  )
}
