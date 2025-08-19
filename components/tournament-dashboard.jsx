"use client"

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Trophy,
  Flag,
  Eye,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react"
import { useState } from "react"
import TournamentSettings from "./tournament-settings"

export function TournamentDashboard({ tournament, matchResults, disputes, user }) {
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showScreenshots, setShowScreenshots] = useState(false)
  const [adminDecision, setAdminDecision] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [currentTournament, setCurrentTournament] = useState(tournament)
  const [isSeeding, setIsSeeding] = useState(false)

  const handleSaveSettings = (updatedTournament) => {
    setCurrentTournament(updatedTournament)
    window.location.reload()
  }

  const handleRandomSeeding = async () => {
    setIsSeeding(true)
    try {
      const response = await fetch(`/api/tournaments/${currentTournament.id}/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedingType: "random",
          userId: user.id,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Tournament seeded successfully:", result)
        window.location.href = `/tournaments/${currentTournament.id}`
      } else {
        const error = await response.json()
        console.error("[v0] Failed to seed tournament:", error.error)
        alert(`Failed to seed tournament: ${error.error}`)
      }
    } catch (error) {
      console.error("[v0] Error seeding tournament:", error)
      alert("Failed to seed tournament. Please try again.")
    } finally {
      setIsSeeding(false)
    }
  }

  const handleResultDecision = async (resultId, decision, winnerId = null) => {
    try {
      const response = await fetch("/api/admin/match-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId,
          decision,
          winnerId,
          adminNotes: adminDecision,
        }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Error processing result:", error)
    }
  }

  const handleSetRoundDeadline = async (roundId, deadline) => {
    try {
      const response = await fetch("/api/admin/set-deadline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, deadline }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Error setting deadline:", error)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{currentTournament.title}</h1>
            <p className="text-slate-400">Tournament Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm border ${
                currentTournament.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : currentTournament.status === "completed"
                    ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
              }`}
            >
              {currentTournament.status || "Draft"}
            </span>
          </div>
        </div>

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
                  {currentTournament.current_participants || 0}/{currentTournament.max_participants}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Format:</span>
                <span className="text-white">{currentTournament.tournament_type || "Single Elimination"}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Match Results</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Pending:</span>
                <span className="text-yellow-400">{matchResults.filter((r) => r.status === "pending").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approved:</span>
                <span className="text-green-400">{matchResults.filter((r) => r.status === "approved").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Disputed:</span>
                <span className="text-red-400">{disputes.filter((d) => d.status === "open").length}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="text-slate-300">
                {matchResults.length > 0 ? `${matchResults.length} match results submitted` : "No recent activity"}
              </div>
              <div className="text-slate-300">
                {disputes.length > 0 ? `${disputes.length} disputes filed` : "No disputes"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Round Management</h2>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Tournament Settings
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournament.rounds?.map((round) => (
            <div key={round.id} className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-white">{round.round_name}</h3>
                  <p className="text-slate-400 text-sm">Round {round.round_number}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    round.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : round.status === "completed"
                        ? "bg-gray-500/20 text-gray-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {round.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Deadline:</span>
                  <span className="text-white">
                    {round.deadline ? new Date(round.deadline).toLocaleDateString() : "Not set"}
                  </span>
                </div>

                {round.status === "active" && (
                  <div className="mt-3">
                    <input
                      type="datetime-local"
                      className="w-full bg-slate-600 text-white rounded px-2 py-1 text-xs"
                      onChange={(e) => handleSetRoundDeadline(round.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Tournament Seeding</h2>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm border ${
                currentTournament.bracket_generated
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              }`}
            >
              {currentTournament.bracket_generated ? "Bracket Generated" : "Awaiting Seeding"}
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
                  {currentTournament.current_participants || 0}/{currentTournament.max_participants}
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

      <TournamentSettings
        tournament={currentTournament}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
      />
    </div>
  )
}

export default TournamentDashboard
