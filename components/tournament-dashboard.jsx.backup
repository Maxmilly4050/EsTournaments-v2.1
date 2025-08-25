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

<<<<<<< HEAD
export function TournamentDashboard({ tournament, matchResults, disputes, user, isAdmin = false }) {
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showScreenshots, setShowScreenshots] = useState(false)
  const [adminDecision, setAdminDecision] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [currentTournament, setCurrentTournament] = useState(tournament)
  const [isSeeding, setIsSeeding] = useState(false)
=======
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
>>>>>>> 718c315 (Bracket UI fix)

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

      // Check if tables exist
      const { error: tableCheckError } = await supabase.from("tournaments").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        // Tables don't exist, use fallback data
        setTournament({
          id,
          title: `Tournament #${id}`,
          game: "Sample Game",
          organizer_id: currentUser.id,
          status: "ongoing",
        })
        setMatchResults([])
        setDisputes([])
        return
      }

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
        setError("Tournament not found")
        return
      }

      if (tournamentData.organizer_id !== currentUser.id) {
        console.log("[v0] User is not organizer, redirecting to tournament page")
        router.push(`/tournaments/${id}`)
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
    } catch (error) {
      console.error("[v0] Dashboard error:", error)
      setError("Failed to load dashboard")
    }
  }, [router])

  useEffect(() => {
    if (!tournamentId) return

    async function load() {
      setLoading(true)
      await fetchDashboardData(tournamentId)
      setLoading(false)
    }

    load()
  }, [tournamentId, fetchDashboardData, refreshTrigger])

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
  }, [tournamentId, refreshDashboardData])

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

// InvitePlayersModal component
function InvitePlayersModal({ tournament, onInviteSent }) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error("Please enter a username")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitee_username: username.trim(),
          message: message.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast.success(`Invitation sent to ${username}!`)
      setUsername("")
      setMessage("")
      setOpen(false)
      onInviteSent?.()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Players
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Player to Tournament</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter player's username"
              disabled={loading}
              required
            />
          </div>
<<<<<<< HEAD
          <div className="flex items-center gap-3">
            <a
              href={`/tournaments/${currentTournament.id}/results`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Results Management
            </a>
            <span
              className={`px-3 py-1 rounded-full text-sm border ${
                currentTournament.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : currentTournament.status === "completed"
                    ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
              }`}
=======
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Message (optional)
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
              disabled={loading}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
>>>>>>> 718c315 (Bracket UI fix)
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

<<<<<<< HEAD
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Tournament Info</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Game:</span>
                <span className="text-white">{currentTournament.game}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Participants:</span>
                <span className="text-white">
                  {currentTournament.tournament_participants?.length || currentTournament.current_participants || 0}/{currentTournament.max_participants}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Format:</span>
                <span className="text-white">{currentTournament.tournament_type || "Single Elimination"}</span>
              </div>
            </div>
          </div>
=======
// InvitationsList component
function InvitationsList({ tournament }) {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvites, setShowInvites] = useState(false)
>>>>>>> 718c315 (Bracket UI fix)

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/invite`)
      const data = await response.json()

<<<<<<< HEAD
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="space-y-2 text-sm">
              {disputes && disputes.length > 0 ? (
                <div className="space-y-1">
                  {disputes
                    .filter(dispute => dispute.status === "open")
                    .slice(0, 3)
                    .map(dispute => (
                      <div key={dispute.id} className="flex items-center gap-2 text-red-400">
                        <Flag className="w-3 h-3" />
                        <span className="text-xs">
                          Dispute raised in Round {dispute.matches?.round} - {dispute.reason.slice(0, 30)}
                          {dispute.reason.length > 30 ? '...' : ''}
                        </span>
                      </div>
                    ))}
                  {disputes.filter(d => d.status === "open").length > 3 && (
                    <div className="text-xs text-slate-400 ml-5">
                      +{disputes.filter(d => d.status === "open").length - 3} more disputes
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-300">No disputes</div>
              )}
              <div className="text-slate-300">
                {matchResults.length > 0 ? `${matchResults.length} match results submitted` : "No recent activity"}
              </div>
            </div>
          </div>
        </div>
=======
      if (response.ok) {
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showInvites) {
      fetchInvitations()
    }
  }, [showInvites, tournament.id])

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'default'
      case 'accepted': return 'default'
      case 'declined': return 'destructive'
      case 'cancelled': return 'secondary'
      default: return 'default'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'accepted': return 'bg-green-500'
      case 'declined': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Tournament Invitations
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInvites(!showInvites)}
          className="text-white border-slate-600"
        >
          {showInvites ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              View Invites
            </>
          )}
        </Button>
>>>>>>> 718c315 (Bracket UI fix)
      </div>

      {showInvites && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 py-4">Loading invitations...</div>
          ) : invitations.length === 0 ? (
            <div className="text-center text-gray-400 py-4">No invitations sent yet</div>
          ) : (
            invitations.map((invitation) => (
              <div key={invitation.id} className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {invitation.invitee.username}
                    </span>
                    <Badge variant={getStatusBadgeVariant(invitation.status)} className={getStatusColor(invitation.status)}>
                      {invitation.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(invitation.invited_at).toLocaleDateString()}
                  </span>
                </div>
                {invitation.message && (
                  <p className="text-sm text-gray-300 mt-2">"{invitation.message}"</p>
                )}
              </div>
<<<<<<< HEAD
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Tournament Seeding</h2>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm border flex items-center gap-1 ${
                currentTournament.bracket_generated
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              }`}
            >
              {currentTournament.bracket_generated ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Seeded
                </>
              ) : (
                "Awaiting Seeding"
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Bracket Status</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Registered Players:</span>
                <span className="text-white">
                  {currentTournament.tournament_participants?.length || currentTournament.current_participants || 0}/{currentTournament.max_participants}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bracket Status:</span>
                <span className={currentTournament.bracket_generated ? "text-green-400" : "text-yellow-400"}>
                  {currentTournament.bracket_generated ? "Generated" : "Not Generated"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Matches:</span>
                <span className="text-white">{currentTournament.total_matches || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Seeding Actions</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleRandomSeeding}
                disabled={isSeeding || currentTournament.bracket_generated}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                {isSeeding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating Bracket...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4" />
                    Random Seeding
                  </>
                )}
              </button>

              {currentTournament.bracket_generated && (
                <p className="text-xs text-slate-400 text-center">
                  Bracket has already been generated. Reset tournament to re-seed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {matchResults.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Match Results Review</h2>
          <div className="space-y-4">
            {matchResults
              .filter((result) => result.status === "pending" || result.requires_admin_review)
              .map((result) => (
                <div key={result.id} className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-white">
                        Round {result.matches?.round} - Match {result.matches?.match_number}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {result.matches?.player1?.username} vs {result.matches?.player2?.username}
                      </p>
                      {result.requires_admin_review && (
                        <span className="inline-flex items-center gap-1 text-red-400 text-sm mt-1">
                          <AlertTriangle className="w-4 h-4" />
                          Conflicting Results - Admin Review Required
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedMatch(result)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        Review
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-slate-600/30 rounded p-3">
                      <h4 className="text-white font-medium mb-2">{result.matches?.player1?.username}</h4>
                      {result.player1_screenshot_url ? (
                        <div>
                          <img
                            src={result.player1_screenshot_url || "/placeholder.svg"}
                            alt="Player 1 Result"
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                          <p className="text-sm text-slate-300">
                            Submitted: {new Date(result.player1_submitted_at).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div className="h-32 bg-slate-700 rounded flex items-center justify-center">
                          <span className="text-slate-400">No screenshot submitted</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-600/30 rounded p-3">
                      <h4 className="text-white font-medium mb-2">{result.matches?.player2?.username}</h4>
                      {result.player2_screenshot_url ? (
                        <div>
                          <img
                            src={result.player2_screenshot_url || "/placeholder.svg"}
                            alt="Player 2 Result"
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                          <p className="text-sm text-slate-300">
                            Submitted: {new Date(result.player2_submitted_at).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div className="h-32 bg-slate-700 rounded flex items-center justify-center">
                          <span className="text-slate-400">No screenshot submitted</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-600/20 rounded">
                    <textarea
                      placeholder="Add admin notes (optional)..."
                      value={adminDecision}
                      onChange={(e) => setAdminDecision(e.target.value)}
                      className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm mb-3"
                      rows={2}
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResultDecision(result.id, "approve", result.matches?.player1?.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Declare {result.matches?.player1?.username} Winner
                      </button>
                      <button
                        onClick={() => handleResultDecision(result.id, "approve", result.matches?.player2?.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Declare {result.matches?.player2?.username} Winner
                      </button>
                      <button
                        onClick={() => handleResultDecision(result.id, "reject")}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Request Rematch
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {disputes.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Active Disputes</h2>
          <div className="space-y-4">
            {disputes
              .filter((dispute) => dispute.status === "open")
              .map((dispute) => (
                <div key={dispute.id} className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-white flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-400" />
                        Round {dispute.matches?.round} - Match {dispute.matches?.match_number}
                      </h3>
                      <p className="text-slate-400 text-sm">Disputed by {dispute.disputed_by_profile?.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Resolve
                      </button>
                      <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Escalate
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">Reason: {dispute.reason}</div>
                  {dispute.evidence_url && (
                    <div className="mt-2">
                      <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        View Evidence
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Tournament Timeline & Logs</h2>
          <div className="space-y-3">
            {tournament.logs?.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-700/20 rounded">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">{log.description}</p>
                  <p className="text-slate-400 text-xs mt-1">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}

            {(!tournament.logs || tournament.logs.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tournament activity yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      <TournamentSettings
        tournament={currentTournament}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
      />
=======
            ))
          )}
        </div>
      )}
>>>>>>> 718c315 (Bracket UI fix)
    </div>
  )
}

// TournamentDashboard component that was missing
export function TournamentDashboard({ tournament, matchResults, disputes, user, onRefreshData }) {
  const [inviteRefreshTrigger, setInviteRefreshTrigger] = useState(0)

  const handleInviteSent = () => {
    setInviteRefreshTrigger(prev => prev + 1)
    onRefreshData?.()
  }

  if (!tournament) {
    return (
      <div className="text-center text-white">
        <p>No tournament data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-4">
          Tournament Dashboard: {tournament.title}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
          <div className="bg-slate-700 p-4 rounded">
            <h3 className="font-semibold">Status</h3>
            <p className="capitalize">{tournament.status}</p>
          </div>
          <div className="bg-slate-700 p-4 rounded">
            <h3 className="font-semibold">Game</h3>
            <p>{tournament.game}</p>
          </div>
          <div className="bg-slate-700 p-4 rounded">
            <h3 className="font-semibold">Matches</h3>
            <p>{tournament.matches?.length || 0} matches</p>
          </div>
        </div>

        {/* Invite Players Section */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Player Management</h2>
            <InvitePlayersModal tournament={tournament} onInviteSent={handleInviteSent} />
          </div>
        </div>
      </div>

      {/* Invitations List */}
      <InvitationsList tournament={tournament} key={inviteRefreshTrigger} />

      {matchResults && matchResults.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Match Results</h2>
          <div className="space-y-2">
            {matchResults.slice(0, 5).map((result) => (
              <div key={result.id} className="bg-slate-700 p-3 rounded text-white">
                <p>Match Result #{result.id} - Status: {result.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {disputes && disputes.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Active Disputes</h2>
          <div className="space-y-2">
            {disputes.slice(0, 3).map((dispute) => (
              <div key={dispute.id} className="bg-slate-700 p-3 rounded text-white">
                <p>Dispute #{dispute.id} - Status: {dispute.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onRefreshData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Refresh Data
        </button>
      </div>
    </div>
  )
}
