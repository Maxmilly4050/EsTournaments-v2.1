"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Users, Send, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

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
  const refreshDashboardData = useCallback(async () => {
    // Allow callers to await a full data reload
    setRefreshTrigger(prev => prev + 1)
  }, [])

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

  // Extracted: load all dashboard datasets at once
  const fetchDashboardData = useCallback(async (id) => {
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
        .eq("id", id)
        .single()

      if (tournamentError) {
        console.error("[v0] Tournament fetch error:", tournamentError)
        // Use fallback data
        setTournament({
          id,
          title: `Tournament #${id}`,
          game: "Sample Game",
          organizer_id: currentUser.id,
          status: "ongoing",
        })
      } else {
        setTournament(tournamentData)
      }

      // Fetch match results
      const { data: resultsData, error: resultsError } = await supabase
        .from("match_results")
        .select(`
          *,
          matches (
            id,
            round,
            match_number,
            tournament_id,
            player1_id,
            player2_id,
            player1:player1_id (username, full_name),
            player2:player2_id (username, full_name)
          ),
          submitted_by:submitted_by_id (username, full_name)
        `)
        .eq("matches.tournament_id", id)

      if (resultsError) {
        console.error("[v0] Results fetch error:", resultsError)
      } else {
        setMatchResults(resultsData || [])
      }

      // Fetch disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from("disputes")
        .select(`
          *,
          matches (
            id,
            round,
            match_number,
            tournament_id,
            player1:player1_id (username, full_name),
            player2:player2_id (username, full_name)
          ),
          submitted_by:submitted_by_id (username, full_name)
        `)
        .eq("matches.tournament_id", id)

      if (disputesError) {
        console.error("[v0] Disputes fetch error:", disputesError)
      } else {
        setDisputes(disputesData || [])
      }

    } catch (error) {
      console.error("[v0] Dashboard data fetch error:", error)
      setError("Failed to load tournament data")
    } finally {
      setLoading(false)
    }
  }, [router])

  // Effect to fetch data when tournamentId changes
  useEffect(() => {
    if (tournamentId) {
      console.log("[v0] Fetching dashboard data for tournament:", tournamentId)
      fetchDashboardData(tournamentId)
    }
  }, [tournamentId, refreshTrigger, fetchDashboardData])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading tournament dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-400">{error}</div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Tournament not found</div>
        </div>
      </div>
    )
  }

  const isOrganizer = user && tournament && user.id === tournament.organizer_id
  const isAdmin = user && user.user_metadata && user.user_metadata.role === 'admin'
  const canManage = isOrganizer || isAdmin

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Tournament Header */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{tournament.title}</h1>
                <p className="text-slate-400 mt-1">
                  {tournament.game} • {tournament.tournament_type || "Single Elimination"}
                </p>
              </div>
              <Badge className={`px-3 py-1 text-sm font-medium rounded-full ${
                tournament.status === "active" 
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : tournament.status === "completed"
                    ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
              }`}>
                {tournament.status || "ongoing"}
              </Badge>
            </div>

            {canManage && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push(`/tournaments/${tournament.id}/results`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Results
                </Button>
                <Button
                  onClick={() => router.push(`/tournaments/${tournament.id}/bracket`)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  View Bracket
                </Button>
              </div>
            )}
          </div>

          {/* Tournament Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">
                  {tournament.current_participants || 0}/{tournament.max_participants}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Match Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {matchResults.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Active Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">
                  {disputes.filter(d => d.status === "open").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matchResults.slice(0, 5).map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">
                        Match Result Submitted
                      </div>
                      <div className="text-sm text-slate-400">
                        Round {result.matches?.round} • Match #{result.matches?.match_number}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {new Date(result.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}

                {disputes.slice(0, 3).map((dispute, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg">
                    <div>
                      <div className="text-white font-medium">
                        Dispute Raised
                      </div>
                      <div className="text-sm text-slate-400">
                        {dispute.reason.substring(0, 50)}...
                      </div>
                    </div>
                    <Badge variant="destructive">
                      {dispute.status}
                    </Badge>
                  </div>
                ))}

                {matchResults.length === 0 && disputes.length === 0 && (
                  <div className="text-center text-slate-400 py-8">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
