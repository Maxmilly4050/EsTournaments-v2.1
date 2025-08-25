"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { TournamentDashboard } from "@/components/tournament-dashboard"
import Header from "@/components/header"

export default function TournamentDashboardPage({ params }) {
  const router = useRouter()
  const [tournament, setTournament] = useState(null)
  const [user, setUser] = useState(null)
  const [matchResults, setMatchResults] = useState([])
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tournamentId, setTournamentId] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to refresh dashboard data
  const refreshDashboardData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Handle async params resolution
  useEffect(() => {
    async function resolveParams() {
      try {
        // Handle params as promise in Next.js App Router
        const resolvedParams = await params
        const id = resolvedParams.id

        if (id === "create" || isNaN(Number.parseInt(id))) {
          router.push("/tournaments")
          return
        }

        setTournamentId(id)
      } catch (error) {
        console.error("[v0] Failed to resolve params:", error)
        router.push("/tournaments")
      }
    }

    resolveParams()
  }, [params, router])

  useEffect(() => {
    if (!tournamentId) return

    async function loadDashboardData() {

      const supabase = createClient()

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        console.log("[v0] Dashboard auth check:", { userData: !!userData?.user, error: userError?.message })

        if (userError || !userData?.user) {
          console.log("[v0] Auth failed, redirecting to login")
          router.push("/auth/login")
          return
        }

        const currentUser = userData.user
        setUser(currentUser)

        // Check if tables exist
        const { error: tableCheckError } = await supabase.from("tournaments").select("id").limit(1)

        if (tableCheckError && tableCheckError.message.includes("does not exist")) {
          // Tables don't exist, use fallback data
          setTournament({
            id: tournamentId,
            title: `Tournament #${tournamentId}`,
            game: "Sample Game",
            organizer_id: currentUser.id,
            status: "ongoing",
          })
          setMatchResults([])
          setDisputes([])
        } else {
          // Fetch tournament data
          const { data: tournamentData, error: tournamentError } = await supabase
            .from("tournaments")
            .select(`
              *,
              profiles:organizer_id (username, full_name),
              matches (
                id,
                round,
                match_number,
                player1_id,
                player2_id,
                winner_id,
                status,
                player1:player1_id (username, full_name),
                player2:player2_id (username, full_name)
              )
            `)
            .eq("id", tournamentId)
            .single()

          if (tournamentError) {
            setError("Tournament not found")
            return
          }

          if (tournamentData.organizer_id !== currentUser.id) {
            console.log("[v0] User is not organizer, redirecting to tournament page")
            router.push(`/tournaments/${tournamentId}`)
            return
          }

          setTournament(tournamentData)

          // Fetch match results
          const { data: resultsData } = await supabase
            .from("match_results")
            .select(`
              *,
              matches (
                id,
                round,
                match_number,
                player1_id,
                player2_id,
                player1:player1_id (username, full_name),
                player2:player2_id (username, full_name)
              ),
              submitted_by_profile:submitted_by (username, full_name),
              winner_profile:winner_id (username, full_name)
            `)
            .in("match_id", tournamentData.matches?.map((m) => m.id) || [])
            .order("submitted_at", { ascending: false })

          setMatchResults(resultsData || [])

          // Fetch disputes
          const { data: disputesData } = await supabase
            .from("match_disputes")
            .select(`
              *,
              matches (
                id,
                round,
                match_number,
                player1_id,
                player2_id,
                player1:player1_id (username, full_name),
                player2:player2_id (username, full_name)
              ),
              disputed_by_profile:disputed_by (username, full_name)
            `)
            .in("match_id", tournamentData.matches?.map((m) => m.id) || [])
            .order("created_at", { ascending: false })

          setDisputes(disputesData || [])
        }
      } catch (error) {
        console.error("[v0] Dashboard error:", error)
        setError("Failed to load dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [tournamentId, router, refreshTrigger])

  // Set up real-time subscription for tournament data changes
  useEffect(() => {
    if (!tournamentId) return

    const supabase = createClient()

    // Subscribe to match updates
    const matchSubscription = supabase
      .channel('match_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          console.log('[Dashboard] Match updated, refreshing data...', payload)
          refreshDashboardData()
        }
      )
      .subscribe()

    // Subscribe to match results updates
    const resultSubscription = supabase
      .channel('match_result_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_results'
        },
        (payload) => {
          console.log('[Dashboard] Match result updated, refreshing data...', payload)
          refreshDashboardData()
        }
      )
      .subscribe()

    // Subscribe to tournament updates
    const tournamentSubscription = supabase
      .channel('tournament_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        },
        (payload) => {
          console.log('[Dashboard] Tournament updated, refreshing data...', payload)
          refreshDashboardData()
        }
      )
      .subscribe()

    return () => {
      matchSubscription.unsubscribe()
      resultSubscription.unsubscribe()
      tournamentSubscription.unsubscribe()
    }
  }, [tournamentId])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-900 pt-20 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center text-white">Loading dashboard...</div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-900 pt-20 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center text-red-400">Error: {error}</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-900 pt-20 py-12">
        <div className="container mx-auto px-4">
          <TournamentDashboard
            tournament={tournament}
            matchResults={matchResults}
            disputes={disputes}
            user={user}
            onRefreshData={refreshDashboardData}
          />
        </div>
      </div>
    </>
  )
}
