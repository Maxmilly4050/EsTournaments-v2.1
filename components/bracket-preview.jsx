"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Play, User, Crown, Target } from "lucide-react"
import Link from "next/link"
import { SingleEliminationBracket, DoubleEliminationBracket, Match, SVGViewer } from "@g-loot/react-tournament-brackets"

export default function BracketsViewerComponent({ tournamentId, tournamentType, isOrganizer }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch matches for the tournament
  useEffect(() => {
    let aborted = false
    async function fetchMatches() {
      setError("")
      setLoading(true)
      try {
        const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
          headers: { "Content-Type": "application/json" },
        })
        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(text || `Failed to load matches (HTTP ${res.status})`)
        }
        const data = await res.json()
        if (!aborted) setMatches(Array.isArray(data) ? data : data?.matches || [])
      } catch (e) {
        if (!aborted) setError(typeof e?.message === "string" ? e.message : "Failed to load matches")
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    if (tournamentId) fetchMatches()
    return () => { aborted = true }
  }, [tournamentId])

  // Transform database matches to @g-loot format
  const transformMatches = (dbMatches) => {
    return dbMatches.map((match) => ({
      id: match.id,
      name: match.name || `Match ${match.round}-${match.position_in_schedule}`,
      nextMatchId: match.winner_proceeds_to || null,
      nextLooserMatchId: match.loser_proceeds_to || null,
      tournamentRoundText: `Round ${match.round}`,
      startTime: match.scheduled_for || new Date().toISOString(),
      state: match.status || 'SCHEDULED',
      participants: [
        {
          id: match.player1_id || 'TBD',
          name: match.player1_name || 'TBD',
          isWinner: match.winner_id === match.player1_id,
          status: match.player1_id ? 'PLAYED' : 'NO_PARTY',
          resultText: match.player1_score?.toString() || null
        },
        {
          id: match.player2_id || 'TBD',
          name: match.player2_name || 'TBD',
          isWinner: match.winner_id === match.player2_id,
          status: match.player2_id ? 'PLAYED' : 'NO_PARTY',
          resultText: match.player2_score?.toString() || null
        }
      ]
    }))
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/20 p-4 text-red-300">
        Failed to display bracket: {error}
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center text-slate-300">
        Loading bracket...
      </div>
    )
  }

  // No matches state
  if (!matches || matches.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center text-slate-300">
        Bracket not generated yet. Generate it from the dashboard.
      </div>
    )
  }

  const transformedMatches = transformMatches(matches)

  // Custom match component
  const MatchComponent = ({ match, onMatchClick, topParty, bottomParty, topWon, bottomWon }) => (
    <div className="match-wrapper bg-white border border-gray-300 rounded p-2 cursor-pointer hover:shadow-md">
      <div className={`participant ${topWon ? 'winner' : ''} p-1 border-b`}>
        <span className="font-medium">{topParty.name}</span>
        {topParty.resultText && <span className="ml-2 text-sm">{topParty.resultText}</span>}
      </div>
      <div className={`participant ${bottomWon ? 'winner' : ''} p-1`}>
        <span className="font-medium">{bottomParty.name}</span>
        {bottomParty.resultText && <span className="ml-2 text-sm">{bottomParty.resultText}</span>}
      </div>
    </div>
  )

  // Render appropriate bracket type
  if (tournamentType === 'double_elimination') {
    // For double elimination, we need to separate upper and lower bracket matches
    const upperMatches = transformedMatches.filter(match => !match.nextLooserMatchId)
    const lowerMatches = transformedMatches.filter(match => match.nextLooserMatchId)

    return (
      <div className="w-full">
        <DoubleEliminationBracket
          matches={{ upper: upperMatches, lower: lowerMatches }}
          matchComponent={MatchComponent}
          options={{
            style: {
              width: 200,
              boxHeight: 80,
              canvasPadding: 20,
              spaceBetweenColumns: 80,
              spaceBetweenRows: 20
            }
          }}
        />
      </div>
    )
  }

  // Default to single elimination
  return (
    <div className="w-full">
      <SingleEliminationBracket
        matches={transformedMatches}
        matchComponent={MatchComponent}
        options={{
          style: {
            width: 200,
            boxHeight: 80,
            canvasPadding: 20,
            spaceBetweenColumns: 80,
            spaceBetweenRows: 20
          }
        }}
      />
    </div>
  )
}

export function BracketPreview({ tournament }) {
  const participants = tournament.tournament_participants || []
  const matches = tournament.matches || []

  // Calculate bracket structure based on participants
  const numParticipants = participants.length
  const maxParticipants = tournament.max_participants || 16
  const numRounds = Math.ceil(Math.log2(maxParticipants))

  // Seeding logic - assign seeds based on join order or random for preview
  const getSeededParticipants = () => {
    if (participants.length === 0) return []

    // Basic seeding by join order
    const seeded = [...participants].sort((a, b) => {
      const dateA = new Date(a.joined_at || '1970-01-01')
      const dateB = new Date(b.joined_at || '1970-01-01')
      return dateA - dateB
    })

    return seeded.slice(0, maxParticipants)
  }

  const seededParticipants = getSeededParticipants()

  // Generate preview bracket structure
  const generatePreviewBracket = () => {
    if (seededParticipants.length === 0) return []

    const rounds = []
    let currentRound = [...seededParticipants]
    let roundNumber = 1

    while (currentRound.length > 1) {
      const nextRound = []
      const roundMatches = []

      for (let i = 0; i < currentRound.length; i += 2) {
        const player1 = currentRound[i]
        const player2 = currentRound[i + 1] || { id: 'bye', display_name: 'BYE' }

        // Create match
        const match = {
          id: `preview-${roundNumber}-${i/2}`,
          player1,
          player2,
          round: roundNumber,
          position: i / 2
        }

        roundMatches.push(match)

        // Winner proceeds (for preview, just take first participant)
        nextRound.push(player1)
      }

      rounds.push({
        round: roundNumber,
        matches: roundMatches
      })

      currentRound = nextRound
      roundNumber++
    }

    return rounds
  }

  const previewBracket = generatePreviewBracket()

  if (participants.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Participants Yet</h3>
          <p className="text-gray-500 mb-4">
            Players need to join the tournament before a bracket can be generated.
          </p>
          <Badge variant="outline" className="text-sm">
            {numParticipants} / {maxParticipants} players
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Tournament Bracket Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {numParticipants} / {maxParticipants} players
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {numRounds} rounds
              </Badge>
            </div>
            <Badge variant="secondary">Preview Mode</Badge>
          </div>

          {/* Bracket Visualization */}
          <div className="border rounded-lg bg-gray-50 p-6 overflow-x-auto">
            {previewBracket.length > 0 ? (
              <div className="flex gap-8 min-w-max">
                {previewBracket.map((round, roundIndex) => (
                  <div key={round.round} className="space-y-4">
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {roundIndex === previewBracket.length - 1 ? 'Final' : `Round ${round.round}`}
                      </Badge>
                    </div>
                    <div className="space-y-6">
                      {round.matches.map((match) => (
                        <div key={match.id} className="bg-white rounded border shadow-sm overflow-hidden min-w-[200px]">
                          <div className="p-3 border-b bg-gray-50">
                            <div className="text-xs text-gray-500 text-center">
                              Match {match.position + 1}
                            </div>
                          </div>
                          <div className="divide-y">
                            <div className="p-3 hover:bg-gray-50 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">
                                  {match.player1.display_name || match.player1.name || 'Player 1'}
                                </span>
                                <Crown className="w-4 h-4 text-yellow-500 opacity-50" />
                              </div>
                            </div>
                            <div className="p-3 hover:bg-gray-50 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">
                                  {match.player2.display_name || match.player2.name || 'Player 2'}
                                </span>
                                {match.player2.id !== 'bye' && (
                                  <Crown className="w-4 h-4 text-gray-300" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Bracket structure will appear here once tournament starts</p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Preview Information</h4>
                <p className="text-sm text-blue-700">
                  This is a preview of how the tournament bracket will be structured.
                  The actual bracket will be generated when the tournament starts,
                  with proper seeding and match scheduling.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
