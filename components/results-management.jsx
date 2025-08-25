"use client"

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Flag,
  Trophy,
  Clock,
  User,
  Camera,
  FileImage,
} from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function ResultsManagement({ tournament, user }) {
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminDecision, setAdminDecision] = useState("")
  const [selectedTab, setSelectedTab] = useState("bracket")
  const [errorMsg, setErrorMsg] = useState("") // <- add friendly error state
  const supabase = createClient()

  useEffect(() => {
    if (tournament?.id) {
      fetchTournamentData()
    }
  }, [tournament?.id])

  const fetchTournamentData = async () => {
    try {
      setLoading(true)

      // Fetch matches with results and participant details
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          *,
          player1:profiles!matches_player1_id_fkey(id, username, avatar_url),
          player2:profiles!matches_player2_id_fkey(id, username, avatar_url),
          winner:profiles!matches_winner_id_fkey(id, username),
          match_results(
            id,
            submitted_by,
            winner_id,
            player1_score,
            player2_score,
            screenshot_urls,
            notes,
            status,
            submitted_at,
            reviewed_at,
            reviewed_by
          )
        `)
        .eq("tournament_id", tournament.id)
        .order("round", { ascending: true })
        .order("match_number", { ascending: true })

      if (matchesError) {
        // Avoid dev overlay: warn instead of error
        console.warn("Error fetching matches:", matchesError)
        setErrorMsg("We couldn’t load matches right now. Please try again shortly.")
      } else {
        setMatches(matchesData || [])
      }

      // Fetch disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from("disputes")
        .select(`
          *,
          disputed_by_profile:profiles!disputes_disputed_by_fkey(username),
          matches(
            round,
            match_number,
            player1:profiles!matches_player1_id_fkey(username),
            player2:profiles!matches_player2_id_fkey(username)
          )
        `)
        .eq("tournament_id", tournament.id)
        .order("created_at", { ascending: false })

      if (disputesError) {
        console.warn("Error fetching disputes:", disputesError)
        // Merge with any existing error message
        setErrorMsg((prev) => prev || "We couldn’t load disputes right now. Please try again shortly.")
      } else {
        setDisputes(disputesData || [])
      }
    } catch (error) {
      // Avoid dev overlay in Next.js by not using console.error
      console.warn("Error fetching tournament data:", error)
      setErrorMsg("Something went wrong while loading data. Please refresh and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResultDecision = async (matchId, decision, winnerId = null) => {
    try {
      const response = await fetch("/api/admin/match-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId: matchId,
          decision,
          winnerId,
          adminNotes: adminDecision,
        }),
      })

      if (response.ok) {
        await fetchTournamentData()
        setSelectedMatch(null)
        setAdminDecision("")
      } else {
        const error = await response.json()
        alert(`Failed to process decision: ${error.error}`)
      }
    } catch (error) {
      console.error("Error processing result:", error)
      alert("Failed to process decision. Please try again.")
    }
  }

  const handleDisputeResolution = async (disputeId, resolution) => {
    try {
      // This would call a dispute resolution API endpoint
      const response = await fetch("/api/admin/resolve-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId,
          resolution,
          adminNotes: adminDecision,
        }),
      })

      if (response.ok) {
        await fetchTournamentData()
        setAdminDecision("")
      }
    } catch (error) {
      console.error("Error resolving dispute:", error)
    }
  }

  const getMatchStatus = (match) => {
    if (match.status === "completed" && match.winner_id) {
      return { status: "completed", color: "text-green-400", label: "Completed" }
    }

    const result = match.match_results?.[0]
    if (result?.status === "disputed") {
      return { status: "disputed", color: "text-red-400", label: "Disputed" }
    }

    if (result && result.status === "pending") {
      return { status: "pending", color: "text-yellow-400", label: "Pending Review" }
    }

    if (result && result.status === "approved") {
      return { status: "approved", color: "text-blue-400", label: "Approved" }
    }

    return { status: "awaiting", color: "text-slate-400", label: "Awaiting Results" }
  }

  const renderBracketView = () => {
    const rounds = {}
    matches.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = []
      }
      rounds[match.round].push(match)
    })

    return (
      <div className="space-y-6">
        {errorMsg && (
          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 px-4 py-3">
            {errorMsg}
          </div>
        )}
        {Object.entries(rounds).map(([round, roundMatches]) => (
          <div key={round} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Round {round}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roundMatches.map(match => {
                const matchStatus = getMatchStatus(match)
                return (
                  <div key={match.id} className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="text-sm text-slate-400">Match {match.match_number}</div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className={`text-sm ${match.winner_id === match.player1_id ? 'text-green-400 font-semibold' : 'text-white'}`}>
                              {match.player1?.username || "TBD"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 ml-6">vs</div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className={`text-sm ${match.winner_id === match.player2_id ? 'text-green-400 font-semibold' : 'text-white'}`}>
                              {match.player2?.username || "TBD"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs ${matchStatus.color}`}>
                          {matchStatus.label}
                        </span>
                        {match.winner_id && (
                          <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                            <Trophy className="w-3 h-3" />
                            Winner: {match.winner?.username}
                          </div>
                        )}
                      </div>
                    </div>

                    {(match.match_results?.[0] || matchStatus.status === "disputed") && (
                      <button
                        onClick={() => setSelectedMatch(match)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Review Details
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderResultsReview = () => {
    const pendingMatches = matches.filter(match => {
      const result = match.match_results?.[0]
      return result && (result.status === "pending" || result.status === "disputed")
    })

    return (
      <div className="space-y-4">
        {pendingMatches.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No results requiring review at this time</p>
          </div>
        ) : (
          pendingMatches.map(match => {
            const result = match.match_results?.[0]
            return (
              <div key={match.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Round {match.round} - Match {match.match_number}
                    </h3>
                    <p className="text-slate-400">
                      {match.player1?.username} vs {match.player2?.username}
                    </p>
                    {result?.status === "disputed" && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <AlertTriangle className="w-4 h-4" />
                        Disputed Result - Admin Review Required
                      </div>
                    )}
                    {result?.status === "pending" && (
                      <div className="flex items-center gap-2 text-yellow-400 text-sm mt-2">
                        <Clock className="w-4 h-4" />
                        Result Pending Review
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">Submitted Result</h4>
                      <div className="text-sm text-slate-300 space-y-1">
                        <div>Winner: {result?.winner_id === match.player1_id ? match.player1?.username : match.player2?.username}</div>
                        <div>Score: {match.player1?.username} {result?.player1_score || 0} - {result?.player2_score || 0} {match.player2?.username}</div>
                        {result?.notes && <div>Notes: {result.notes}</div>}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      Submitted: {result?.submitted_at ? new Date(result.submitted_at).toLocaleString() : "Unknown"}
                    </div>
                  </div>

                  {result?.screenshot_urls && result.screenshot_urls.length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-slate-300">Evidence Screenshots:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {result.screenshot_urls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Match Result Evidence ${index + 1}`}
                            className="w-full h-32 object-cover rounded border border-slate-600"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 bg-slate-600/30 rounded flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <FileImage className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <span className="text-xs">No screenshots submitted</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-700/20 rounded-lg p-4">
                  <textarea
                    placeholder="Add admin notes (optional)..."
                    value={adminDecision}
                    onChange={(e) => setAdminDecision(e.target.value)}
                    className="w-full bg-slate-600 text-white rounded px-3 py-2 text-sm mb-4"
                    rows={3}
                  />

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleResultDecision(match.id, "approve", match.player1_id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Declare {match.player1?.username} Winner
                    </button>
                    <button
                      onClick={() => handleResultDecision(match.id, "approve", match.player2_id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Declare {match.player2?.username} Winner
                    </button>
                    <button
                      onClick={() => handleResultDecision(match.id, "reject")}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Request Rematch
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    )
  }

  const renderDisputesView = () => {
    const activeDisputes = disputes.filter(dispute => dispute.status === "open")

    return (
      <div className="space-y-4">
        {activeDisputes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active disputes at this time</p>
          </div>
        ) : (
          activeDisputes.map(dispute => (
            <div key={dispute.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-400" />
                    Round {dispute.matches?.round} - Match {dispute.matches?.match_number}
                  </h3>
                  <p className="text-slate-400">
                    {dispute.matches?.player1?.username} vs {dispute.matches?.player2?.username}
                  </p>
                  <p className="text-sm text-slate-300 mt-2">
                    Disputed by: {dispute.disputed_by_profile?.username}
                  </p>
                </div>
                <div className="text-sm text-slate-400">
                  {new Date(dispute.created_at).toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                <h4 className="text-white font-medium mb-2">Dispute Reason</h4>
                <p className="text-slate-300 text-sm">{dispute.reason}</p>
                {dispute.evidence_url && (
                  <div className="mt-3">
                    <img
                      src={dispute.evidence_url}
                      alt="Dispute Evidence"
                      className="max-w-sm h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div className="bg-slate-700/20 rounded-lg p-4">
                <textarea
                  placeholder="Add resolution notes..."
                  value={adminDecision}
                  onChange={(e) => setAdminDecision(e.target.value)}
                  className="w-full bg-slate-600 text-white rounded px-3 py-2 text-sm mb-4"
                  rows={3}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => handleDisputeResolution(dispute.id, "resolved")}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve Dispute
                  </button>
                  <button
                    onClick={() => handleDisputeResolution(dispute.id, "escalated")}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Escalate
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Results Management</h1>
            <p className="text-slate-400">{tournament.title}</p>
          </div>
        </div>

        <div className="flex space-x-1 bg-slate-700/30 rounded-lg p-1 mb-6">
          <button
            onClick={() => setSelectedTab("bracket")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === "bracket"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-600/50"
            }`}
          >
            Tournament Bracket
          </button>
          <button
            onClick={() => setSelectedTab("results")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === "results"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-600/50"
            }`}
          >
            Results Review
          </button>
          <button
            onClick={() => setSelectedTab("disputes")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === "disputes"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-600/50"
            }`}
          >
            Active Disputes ({disputes.filter(d => d.status === "open").length})
          </button>
        </div>
      </div>

      {selectedTab === "bracket" && renderBracketView()}
      {selectedTab === "results" && renderResultsReview()}
      {selectedTab === "disputes" && renderDisputesView()}
    </div>
  )
}

export default ResultsManagement
