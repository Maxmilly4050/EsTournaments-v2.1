"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { Calendar, Users, Trophy, Clock, MapPin, DollarSign, Trash2, AlertTriangle } from "lucide-react"

export default function MyTournamentsPage() {
  const [user, setUser] = useState(null)
  const [organizedTournaments, setOrganizedTournaments] = useState([])
  const [joinedTournaments, setJoinedTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("organized")
  const [deleteDialog, setDeleteDialog] = useState({ open: false, tournament: null })
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
      await fetchTournaments(user.id)
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/auth/login")
    }
  }

  const fetchTournaments = async (userId) => {
    try {
      const { data: organized, error: organizedError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("organizer_id", userId)
        .order("created_at", { ascending: false })

      if (organizedError) throw organizedError

      const { data: joined, error: joinedError } = await supabase
        .from("tournament_participants")
        .select(`
          *,
          tournaments (*)
        `)
        .eq("user_id", userId)
        .order("joined_at", { ascending: false })

      if (joinedError) throw joinedError

      setOrganizedTournaments(organized || [])
      setJoinedTournaments(joined || [])
    } catch (error) {
      console.error("Error fetching tournaments:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "TBD"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }
  }

  const deleteTournament = async (tournament) => {
    setDeleting(true)
    try {
      if (tournament.status === "completed" && !tournament.is_free && tournament.prize_pool) {
        const { data: matches } = await supabase
          .from("matches")
          .select("winner_id")
          .eq("tournament_id", tournament.id)
          .not("winner_id", "is", null)

        if (matches && matches.length > 0) {
          console.log("Tournament has completed matches with winners - ensure prizes are cleared")
        }
      }

      await supabase.from("matches").delete().eq("tournament_id", tournament.id)
      await supabase.from("tournament_participants").delete().eq("tournament_id", tournament.id)

      const { error } = await supabase.from("tournaments").delete().eq("id", tournament.id).eq("organizer_id", user.id)

      if (error) throw error

      setOrganizedTournaments((prev) => prev.filter((t) => t.id !== tournament.id))
      setDeleteDialog({ open: false, tournament: null })
      setDeleteConfirmText("")
    } catch (error) {
      console.error("Error deleting tournament:", error)
      alert("Failed to delete tournament. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  const canDeleteTournament = (tournament) => {
    if (tournament.status === "active") {
      return { canDelete: false, reason: "Cannot delete an active tournament" }
    }

    if (tournament.status === "completed" && !tournament.is_free && tournament.prize_pool) {
      return { canDelete: true, reason: "Ensure all prizes have been distributed before deletion" }
    }

    return { canDelete: true, reason: null }
  }

  const TournamentCard = ({ tournament, isJoined = false }) => {
    const deleteCheck = canDeleteTournament(tournament)

    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6 hover:bg-slate-800/70 transition-all">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <div
            className="flex-1"
            onClick={() => router.push(`/tournaments/${tournament.id}`)}
            style={{ cursor: "pointer" }}
          >
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{tournament.title}</h3>
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <MapPin className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-sm">{tournament.game}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm border ${getStatusColor(tournament.status)}`}
            >
              {tournament.status || "Draft"}
            </span>
            {!isJoined && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (deleteCheck.canDelete) {
                    setDeleteDialog({ open: true, tournament })
                  } else {
                    alert(deleteCheck.reason)
                  }
                }}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                  deleteCheck.canDelete
                    ? "hover:bg-red-600/20 text-red-400 hover:text-red-300"
                    : "text-slate-600 cursor-not-allowed"
                }`}
                title={deleteCheck.reason || "Delete tournament"}
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            )}
          </div>
        </div>

        <div onClick={() => router.push(`/tournaments/${tournament.id}`)} style={{ cursor: "pointer" }}>
          <p className="text-slate-300 text-sm md:text-base mb-3 md:mb-4 line-clamp-2">
            {tournament.description || "No description provided."}
          </p>

          <div className="grid grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">{formatDate(tournament.start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">
                {tournament.current_participants || 0}/{tournament.max_participants}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Trophy className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">{tournament.tournament_type || "Single Elimination"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">
                {tournament.is_free
                  ? "Free"
                  : `${tournament.entry_fee_amount || 0} ${tournament.entry_fee_currency || "USD"}`}
              </span>
            </div>
          </div>

          {isJoined && (
            <div className="flex items-center gap-2 text-green-400 text-xs md:text-sm">
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              <span>Joined {formatDate(tournament.joined_at)}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-white">Loading your tournaments...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Tournaments</h1>
          <p className="text-slate-400">Manage your organized tournaments and track your participation</p>
        </div>

        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setActiveTab("organized")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "organized"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            Organized ({organizedTournaments.length})
          </button>
          <button
            onClick={() => setActiveTab("joined")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "joined"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            Joined ({joinedTournaments.length})
          </button>
        </div>

        {activeTab === "organized" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">Tournaments You've Organized</h2>
              <button
                onClick={() => router.push("/tournaments/create")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create New Tournament
              </button>
            </div>

            {organizedTournaments.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">No tournaments organized yet</h3>
                <p className="text-slate-500 mb-6">Create your first tournament to get started</p>
                <button
                  onClick={() => router.push("/tournaments/create")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Create Tournament
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {organizedTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "joined" && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">Tournaments You've Joined</h2>

            {joinedTournaments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">No tournaments joined yet</h3>
                <p className="text-slate-500 mb-6">Browse tournaments to find competitions to join</p>
                <button
                  onClick={() => router.push("/tournaments")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Browse Tournaments
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {joinedTournaments.map((participation) => (
                  <TournamentCard
                    key={participation.id}
                    tournament={{ ...participation.tournaments, joined_at: participation.joined_at }}
                    isJoined={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {deleteDialog.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-xl font-semibold text-white">Delete Tournament</h3>
              </div>

              <div className="mb-4">
                <p className="text-slate-300 mb-2">
                  Are you sure you want to delete "{deleteDialog.tournament?.title}"?
                </p>
                {deleteDialog.tournament?.status === "completed" && !deleteDialog.tournament?.is_free && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ This tournament has prizes. Ensure all winners have received their prizes before deletion.
                    </p>
                  </div>
                )}
                <p className="text-slate-400 text-sm mb-3">Type the tournament title to confirm deletion:</p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Enter tournament title"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteDialog({ open: false, tournament: null })
                    setDeleteConfirmText("")
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTournament(deleteDialog.tournament)}
                  disabled={deleteConfirmText !== deleteDialog.tournament?.title || deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
