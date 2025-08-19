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

  useEffect(() => {
    async function loadDashboardData() {
      if (params.id === "create" || isNaN(Number.parseInt(params.id))) {
        router.push("/tournaments")
        return
      }

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
            id: params.id,
            title: `Tournament #${params.id}`,
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
            .eq("id", params.id)
            .single()

          if (tournamentError) {
            setError("Tournament not found")
            return
          }

          if (tournamentData.organizer_id !== currentUser.id) {
            console.log("[v0] User is not organizer, redirecting to tournament page")
            router.push(`/tournaments/${params.id}`)
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
  }, [params.id, router])

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
          <TournamentDashboard tournament={tournament} matchResults={matchResults} disputes={disputes} user={user} />
        </div>
      </div>
    </>
  )
}
