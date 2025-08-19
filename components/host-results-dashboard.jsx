"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Trophy, CheckCircle, AlertTriangle, Clock, User, Eye, GamepadIcon, Crown, X, Zap } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function HostResultsDashboard({ matches, currentUser }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [adminNotes, setAdminNotes] = useState("")

  const confirmWinner = async (matchId, winnerId) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/matches/${matchId}/winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner_id: winnerId }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.tournament_complete) {
          toast({
            title: "🏆 Tournament Complete!",
            description: `Winner confirmed and tournament completed! Champion: ${getPlayerName(data.tournament_winner)}`,
          })
        } else if (data.advanced_to_next_round) {
          toast({
            title: "Winner confirmed and advanced",
            description: "Player has been automatically advanced to the next round",
          })
        } else {
          toast({
            title: "Winner confirmed",
            description: data.note || "Match result has been confirmed",
          })
        }

        router.refresh()
      } else {
        toast({
          title: "Failed to confirm winner",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error confirming winner:", error)
      toast({
        title: "Error",
        description: "Failed to confirm winner",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPlayerName = (player) => {
    if (!player) return "Unknown Player"
    return player.username || player.full_name || "Unknown Player"
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getMatchStatus = (match) => {
    const results = match.results || []

    if (results.length === 0) {
      return { type: "waiting", message: "No submissions yet" }
    }

    if (results.length === 1) {
      return { type: "partial", message: "Waiting for second player" }
    }

    if (results.length === 2) {
      // Check if both players submitted (assuming we can determine winner from results)
      return { type: "ready", message: "Both players submitted - Ready for review" }
    }

    return { type: "review", message: "Needs admin review" }
  }

  const categorizeMatches = () => {
    const autoAdvance = []
    const needsReview = []
    const waiting = []

    matches.forEach((match) => {
      const status = getMatchStatus(match)

      if (status.type === "waiting" || status.type === "partial") {
        waiting.push(match)
      } else if (status.type === "ready") {
        // If both submissions agree on winner, it can auto-advance
        // For now, put in needs review since we need to implement winner detection logic
        needsReview.push(match)
      } else {
        needsReview.push(match)
      }
    })

    return { autoAdvance, needsReview, waiting }
  }

  const { autoAdvance, needsReview, waiting } = categorizeMatches()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Host Results Dashboard
          </h1>
          <p className="text-gray-400">Review and confirm match results across all tournaments</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Needs Review</p>
                <p className="text-2xl font-bold text-red-400">{needsReview.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Auto Advance</p>
                <p className="text-2xl font-bold text-green-400">{autoAdvance.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Waiting</p>
                <p className="text-2xl font-bold text-yellow-400">{waiting.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Matches</p>
                <p className="text-2xl font-bold text-blue-400">{matches.length}</p>
              </div>
              <GamepadIcon className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches Needing Review */}
      {needsReview.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Matches Needing Review ({needsReview.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsReview.map((match) => {
              const status = getMatchStatus(match)
              return (
                <Card key={match.id} className="bg-slate-700 border-slate-600">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-medium">
                          {match.tournaments.title} - Round {match.round} Match {match.match_number}
                        </h3>
                        <p className="text-gray-400 text-sm">{match.tournaments.game}</p>
                        {match.match_code && <p className="text-blue-400 text-sm">Code: {match.match_code}</p>}
                      </div>
                      <Badge variant="destructive">{status.message}</Badge>
                    </div>

                    {/* Players and Results */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Player 1 */}
                      <div className="bg-slate-600 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-white font-medium">{getPlayerName(match.player1)}</span>
                        </div>

                        {match.results.find((r) => r.submitted_by === match.player1_id) ? (
                          <div className="space-y-2">
                            {(() => {
                              const result = match.results.find((r) => r.submitted_by === match.player1_id)
                              return (
                                <>
                                  <div className="text-sm text-gray-300">
                                    <strong>Score:</strong> {result.score || "Not provided"}
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    <strong>Submitted:</strong> {formatDate(result.created_at)}
                                  </div>
                                  {result.screenshot_url && (
                                    <img
                                      src={result.screenshot_url || "/placeholder.svg"}
                                      alt="Player 1 result"
                                      className="w-full h-24 object-cover rounded cursor-pointer"
                                      onClick={() => window.open(result.screenshot_url, "_blank")}
                                    />
                                  )}
                                  {result.result_notes && (
                                    <div className="text-sm text-gray-300 bg-slate-700 p-2 rounded">
                                      <strong>Notes:</strong> {result.result_notes}
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400">
                            <Clock className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-sm">No submission yet</p>
                          </div>
                        )}
                      </div>

                      {/* Player 2 */}
                      <div className="bg-slate-600 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-white font-medium">{getPlayerName(match.player2)}</span>
                        </div>

                        {match.results.find((r) => r.submitted_by === match.player2_id) ? (
                          <div className="space-y-2">
                            {(() => {
                              const result = match.results.find((r) => r.submitted_by === match.player2_id)
                              return (
                                <>
                                  <div className="text-sm text-gray-300">
                                    <strong>Score:</strong> {result.score || "Not provided"}
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    <strong>Submitted:</strong> {formatDate(result.created_at)}
                                  </div>
                                  {result.screenshot_url && (
                                    <img
                                      src={result.screenshot_url || "/placeholder.svg"}
                                      alt="Player 2 result"
                                      className="w-full h-24 object-cover rounded cursor-pointer"
                                      onClick={() => window.open(result.screenshot_url, "_blank")}
                                    />
                                  )}
                                  {result.result_notes && (
                                    <div className="text-sm text-gray-300 bg-slate-700 p-2 rounded">
                                      <strong>Notes:</strong> {result.result_notes}
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400">
                            <Clock className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-sm">No submission yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-600">
                      <Button
                        onClick={() => confirmWinner(match.id, match.player1_id)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Confirm {getPlayerName(match.player1)} Winner
                        <Zap className="w-3 h-3 ml-1 text-yellow-300" title="Auto-advances to next round" />
                      </Button>
                      <Button
                        onClick={() => confirmWinner(match.id, match.player2_id)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Confirm {getPlayerName(match.player2)} Winner
                        <Zap className="w-3 h-3 ml-1 text-yellow-300" title="Auto-advances to next round" />
                      </Button>
                      <Button
                        onClick={() => setSelectedMatch(match)}
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Detailed Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* ... existing code for waiting matches and no matches sections ... */}

      {/* Detailed Review Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700">
              <CardTitle className="text-white">
                Detailed Review - {selectedMatch.tournaments.title} Round {selectedMatch.round}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMatch(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Match Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Tournament:</span>
                  <span className="text-white ml-2">{selectedMatch.tournaments.title}</span>
                </div>
                <div>
                  <span className="text-gray-400">Game:</span>
                  <span className="text-white ml-2">{selectedMatch.tournaments.game}</span>
                </div>
                <div>
                  <span className="text-gray-400">Round:</span>
                  <span className="text-white ml-2">{selectedMatch.round}</span>
                </div>
                <div>
                  <span className="text-gray-400">Match:</span>
                  <span className="text-white ml-2">{selectedMatch.match_number}</span>
                </div>
              </div>

              {/* Detailed Results Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[selectedMatch.player1, selectedMatch.player2].map((player, index) => {
                  const playerId = index === 0 ? selectedMatch.player1_id : selectedMatch.player2_id
                  const result = selectedMatch.results.find((r) => r.submitted_by === playerId)

                  return (
                    <div key={playerId} className="bg-slate-800 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <div
                          className={`w-6 h-6 ${index === 0 ? "bg-blue-500" : "bg-purple-500"} rounded-full flex items-center justify-center`}
                        >
                          <User className="w-3 h-3 text-white" />
                        </div>
                        {getPlayerName(player)}
                      </h3>

                      {result ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-gray-400 text-sm">Score Reported:</label>
                            <p className="text-white">{result.score || "Not provided"}</p>
                          </div>

                          <div>
                            <label className="text-gray-400 text-sm">Submission Time:</label>
                            <p className="text-white">{formatDate(result.created_at)}</p>
                          </div>

                          {result.result_notes && (
                            <div>
                              <label className="text-gray-400 text-sm">Notes:</label>
                              <p className="text-white bg-slate-700 p-2 rounded text-sm">{result.result_notes}</p>
                            </div>
                          )}

                          {result.screenshot_url && (
                            <div>
                              <label className="text-gray-400 text-sm">Screenshot:</label>
                              <img
                                src={result.screenshot_url || "/placeholder.svg"}
                                alt={`${getPlayerName(player)} result`}
                                className="w-full rounded cursor-pointer hover:opacity-80"
                                onClick={() => window.open(result.screenshot_url, "_blank")}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Clock className="w-8 h-8 mx-auto mb-2" />
                          <p>No submission from this player</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Admin Notes */}
              <div>
                <label className="text-white font-medium block mb-2">Admin Notes (Optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this decision..."
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <Button
                  onClick={() => {
                    confirmWinner(selectedMatch.id, selectedMatch.player1_id)
                    setSelectedMatch(null)
                  }}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Confirm {getPlayerName(selectedMatch.player1)} Winner
                  <Zap className="w-3 h-3 ml-1 text-yellow-300" />
                </Button>
                <Button
                  onClick={() => {
                    confirmWinner(selectedMatch.id, selectedMatch.player2_id)
                    setSelectedMatch(null)
                  }}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Confirm {getPlayerName(selectedMatch.player2)} Winner
                  <Zap className="w-3 h-3 ml-1 text-yellow-300" />
                </Button>
                <Button
                  onClick={() => setSelectedMatch(null)}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ... existing code for waiting matches and no matches sections ... */}
    </div>
  )
}
