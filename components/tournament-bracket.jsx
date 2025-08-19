"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Play, Users, Award, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { MatchDetailsModal } from "./match-details-modal"
import { createTheme, MATCH_STATES } from "@g-loot/react-tournament-brackets"

const customTheme = createTheme({
  // Define your custom theme here
})

export function TournamentBracket({ tournament, isOrganizer, currentUser }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [participants, setParticipants] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [matches, setMatches] = useState([])

  useEffect(() => {
    const fetchParticipants = async () => {
      if (tournament.tournament_participants) {
        setParticipants(tournament.tournament_participants)
      }
    }
    fetchParticipants()
  }, [tournament])

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase.from("matches").select("*").eq("tournament_id", tournament.id)

      if (error) {
        console.error("Error fetching matches:", error)
        return
      }

      setMatches(data)
    }

    if (tournament.id) {
      fetchMatches()
    }
  }, [tournament.id])

  const setMatchWinner = async (matchId, winnerId) => {
    if (!isOrganizer) return

    try {
      // Update the match with winner
      const { error } = await supabase
        .from("matches")
        .update({
          winner_id: winnerId,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", matchId)

      if (error) {
        console.error("Error setting winner:", error)
        alert("Failed to set winner")
        return
      }

      // Call bracket progression API to advance winner
      const response = await fetch("/api/bracket/advance-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, winnerId }),
      })

      if (!response.ok) {
        throw new Error("Failed to advance winner")
      }

      const result = await response.json()

      if (result.tournamentComplete) {
        alert(`🏆 Tournament Complete! Winner: ${getPlayerName(result.winner)}`)
      }

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("An unexpected error occurred")
    }
  }

  useEffect(() => {
    if (!tournament.id) return

    // Subscribe to match updates
    const matchSubscription = supabase
      .channel(`tournament-${tournament.id}-matches`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournament.id}`,
        },
        (payload) => {
          console.log("Match updated:", payload)
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      matchSubscription.unsubscribe()
    }
  }, [tournament.id, router])

  const generateBracket = async () => {
    if (!isOrganizer) return

    setLoading(true)
    try {
      // First, clear existing matches
      await supabase.from("matches").delete().eq("tournament_id", tournament.id)

      const tournamentParticipants = participants
      const numParticipants = tournamentParticipants.length

      if (numParticipants < 2) {
        alert("Need at least 2 participants to generate bracket")
        setLoading(false)
        return
      }

      // Shuffle participants for random seeding
      const shuffledParticipants = [...tournamentParticipants].sort(() => Math.random() - 0.5)

      // Calculate number of rounds needed
      const numRounds = Math.ceil(Math.log2(numParticipants))
      const matches = []

      // Generate first round matches
      for (let i = 0; i < shuffledParticipants.length; i += 2) {
        const player1 = shuffledParticipants[i]
        const player2 = shuffledParticipants[i + 1] || null

        matches.push({
          tournament_id: tournament.id,
          round: 1,
          match_number: Math.floor(i / 2) + 1,
          player1_id: player1.user_id,
          player2_id: player2?.user_id || null,
          status: player2 ? "pending" : "completed",
          winner_id: player2 ? null : player1.user_id, // Auto-advance if odd number
        })
      }

      // Generate subsequent rounds (empty matches to be filled as tournament progresses)
      let currentRoundMatches = Math.ceil(shuffledParticipants.length / 2)
      for (let round = 2; round <= numRounds; round++) {
        const nextRoundMatches = Math.ceil(currentRoundMatches / 2)
        for (let match = 1; match <= nextRoundMatches; match++) {
          matches.push({
            tournament_id: tournament.id,
            round,
            match_number: match,
            player1_id: null,
            player2_id: null,
            status: "pending",
            winner_id: null,
          })
        }
        currentRoundMatches = nextRoundMatches
      }

      const { error } = await supabase.from("matches").insert(matches)

      if (error) {
        console.error("Error generating bracket:", error)
        alert("Failed to generate bracket")
      } else {
        // Update tournament status to ongoing
        await supabase.from("tournaments").update({ status: "ongoing" }).eq("id", tournament.id)
        router.refresh()
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleMatchClick = (match) => {
    if (match.player1_id && match.player2_id) {
      setSelectedMatch(match)
    }
  }

  const handleResultSubmitted = () => {
    setSelectedMatch(null)
    router.refresh()
  }

  const demoBracket = useMemo(() => {
    const demoParticipants = [
      "Zombie",
      "NK To",
      "Gen.G",
      "KillDo",
      "AxSepc",
      "We a L",
      "D-Gen",
      "Nh-Ho",
      "FGV",
      "Huy's",
      "ATPro",
      "D-Gen",
      "Son's",
      "Clown's",
      "545TV",
      "Loser",
    ].slice(0, participants.length || 8)

    const demoMatches = []
    let matchId = 1000

    // Round 1 matches with fixed random values
    for (let i = 0; i < demoParticipants.length; i += 2) {
      const player1 = demoParticipants[i]
      const player2 = demoParticipants[i + 1]
      const player1Score = (i % 3) + 1 // Fixed scores to prevent randomness
      const player2Score = ((i + 1) % 3) + 1
      const winnerId = player1Score > player2Score ? `demo-${i}` : `demo-${i + 1}`

      demoMatches.push({
        id: matchId++,
        tournament_id: tournament.id,
        round: 1,
        match_number: Math.floor(i / 2) + 1,
        player1_id: `demo-${i}`,
        player2_id: player2 ? `demo-${i + 1}` : null,
        player1_score: player1Score,
        player2_score: player2 ? player2Score : 0,
        status: "completed",
        winner_id: player2 ? winnerId : `demo-${i}`,
        player1: { username: player1 },
        player2: player2 ? { username: player2 } : null,
      })
    }

    // Generate subsequent rounds with fixed data
    let currentRoundSize = Math.ceil(demoParticipants.length / 2)
    let round = 2
    let playerIndex = 0

    while (currentRoundSize > 1) {
      const nextRoundSize = Math.ceil(currentRoundSize / 2)

      for (let i = 0; i < nextRoundSize; i++) {
        const player1Name = demoParticipants[playerIndex % demoParticipants.length]
        const player2Name = demoParticipants[(playerIndex + 1) % demoParticipants.length]
        const player1Score = (playerIndex % 3) + 1
        const player2Score = ((playerIndex + 1) % 3) + 1
        const winnerId = player1Score > player2Score ? `demo-r${round}-${i * 2}` : `demo-r${round}-${i * 2 + 1}`

        demoMatches.push({
          id: matchId++,
          tournament_id: tournament.id,
          round: round,
          match_number: i + 1,
          player1_id: `demo-r${round}-${i * 2}`,
          player2_id: `demo-r${round}-${i * 2 + 1}`,
          player1_score: player1Score,
          player2_score: player2Score,
          status: round === Math.ceil(Math.log2(demoParticipants.length)) ? "pending" : "completed",
          winner_id: round === Math.ceil(Math.log2(demoParticipants.length)) ? null : winnerId,
          player1: { username: player1Name },
          player2: { username: player2Name }, // Declare player2 here
        })

        playerIndex += 2
      }

      currentRoundSize = nextRoundSize
      round++
    }

    return demoMatches
  }, [participants.length, tournament.id])

  const displayMatches = matches.length > 0 ? matches : demoBracket
  const displayRounds = displayMatches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = []
    acc[match.round].push(match)
    return acc
  }, {})
  const displayMaxRound = Math.max(...Object.keys(displayRounds).map(Number), 0)

  const getPlayerName = (playerId) => {
    if (!playerId) return "TBD"

    // Handle demo player IDs
    if (typeof playerId === "string" && playerId.startsWith("demo-")) {
      const match = displayMatches.find((m) => m.player1_id === playerId || m.player2_id === playerId)
      if (match) {
        if (match.player1_id === playerId && match.player1) {
          return match.player1.username || "Player 1"
        }
        if (match.player2_id === playerId && match.player2) {
          return match.player2.username || "Player 2"
        }
      }
      return "Demo Player"
    }

    const participant = participants.find((p) => p.user_id === playerId)
    if (participant?.profiles) {
      return participant.profiles.username || participant.profiles.full_name || "Unknown Player"
    }

    // Fallback for match data
    const match = tournament.matches?.find((m) => m.player1_id === playerId || m.player2_id === playerId)
    if (match) {
      if (match.player1_id === playerId && match.player1) {
        return match.player1.username || match.player1.full_name || "Player 1"
      }
      if (match.player2_id === playerId && match.player2) {
        return match.player2.username || match.player2.full_name || "Player 2"
      }
    }

    return "Unknown Player"
  }

  const CustomMatch = ({ match, onMatchClick, onPartyClick }) => {
    const handleMatchClick = () => {
      if (
        match.originalMatch?.player1_id &&
        match.originalMatch?.player2_id &&
        match.originalMatch?.status !== "completed"
      ) {
        setSelectedMatch(match.originalMatch)
      }
    }

    return (
      <div
        className={`bg-slate-700 rounded-lg border-2 transition-all duration-200 ${
          match.originalMatch?.player1_id &&
          match.originalMatch?.player2_id &&
          match.originalMatch?.status !== "completed"
            ? "cursor-pointer hover:border-blue-400 hover:shadow-lg border-slate-600"
            : "border-slate-600"
        }`}
        onClick={handleMatchClick}
        style={{ width: "200px", minHeight: "80px" }}
      >
        {/* Match Header */}
        <div className="text-xs text-slate-300 text-center p-1 border-b border-slate-600">
          {match.tournamentRoundText}
        </div>

        {/* Participants */}
        {match.participants.map((participant, index) => (
          <div
            key={participant.id}
            className={`flex items-center justify-between p-2 ${
              index === 0 ? "border-b border-slate-600" : ""
            } ${participant.isWinner ? "bg-green-600/30" : ""}`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  participant.isWinner
                    ? "bg-green-500 text-white"
                    : index === 0
                      ? "bg-blue-500 text-white"
                      : "bg-purple-500 text-white"
                }`}
              >
                {participant.name.charAt(0)}
              </div>
              <span className="text-white text-sm font-medium truncate">{participant.name}</span>
            </div>
            <div className="text-white font-bold text-sm">{participant.resultText}</div>
          </div>
        ))}

        {/* Upload indicator */}
        {match.originalMatch?.player1_id &&
          match.originalMatch?.player2_id &&
          match.originalMatch?.status !== "completed" && (
            <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
              <Upload className="w-3 h-3 text-white" />
            </div>
          )}
      </div>
    )
  }

  const ProfessionalBracket = () => {
    console.log("[v0] ProfessionalBracket rendering, matches.length:", displayMatches.length)
    if (displayMatches.length === 0) {
      console.log("[v0] No matches, returning null")
      return null
    }

    const bracketMatches = transformMatchesForBracket()
    console.log("[v0] About to render custom bracket with matches:", bracketMatches.length)

    const rounds = bracketMatches.reduce((acc, match) => {
      const roundText = match.tournamentRoundText
      if (!acc[roundText]) acc[roundText] = []
      acc[roundText].push(match)
      return acc
    }, {})

    const roundOrder = ["Round 1", "Round 2", "Quarterfinals", "Semifinals", "Winners' Finals"]
    const orderedRounds = roundOrder.filter((round) => rounds[round])

    return (
      <div className="bg-slate-900 rounded-lg p-6 min-h-[600px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-2xl font-bold">Tournament Bracket</h3>
          {matches.length === 0 && (
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">Demo Preview</div>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-8 min-w-max p-4">
            {orderedRounds.map((roundName, roundIndex) => (
              <div key={roundName} className="flex flex-col items-center">
                {/* Round Header */}
                <div className="bg-slate-700 text-white px-4 py-2 rounded-lg mb-4 font-semibold text-sm">
                  {roundName}
                </div>

                {/* Matches in this round */}
                <div className="flex flex-col gap-4">
                  {rounds[roundName].map((match) => (
                    <CustomMatch key={match.id} match={match} onMatchClick={() => {}} onPartyClick={() => {}} />
                  ))}
                </div>

                {/* Connector lines to next round */}
                {roundIndex < orderedRounds.length - 1 && (
                  <div
                    className="absolute left-full top-1/2 w-8 h-0.5 bg-slate-600 transform -translate-y-1/2"
                    style={{ marginLeft: "100px" }}
                  />
                )}
              </div>
            ))}

            {/* Trophy for winner */}
            {orderedRounds.length > 0 &&
              rounds[orderedRounds[orderedRounds.length - 1]][0]?.participants.some((p) => p.isWinner) && (
                <div className="flex flex-col items-center justify-center">
                  <Trophy className="w-16 h-16 text-yellow-400 animate-pulse" />
                  <div className="text-yellow-400 font-bold text-lg mt-2">Winner!</div>
                </div>
              )}
          </div>
        </div>
      </div>
    )
  }

  const transformMatchesForBracket = () => {
    console.log("[v0] Transforming matches for bracket, total matches:", displayMatches.length)
    if (!displayMatches.length) {
      console.log("[v0] No matches found, returning empty array")
      return []
    }

    const rounds = displayMatches.reduce((acc, match) => {
      if (!acc[match.round]) acc[match.round] = []
      acc[match.round].push(match)
      return acc
    }, {})

    console.log("[v0] Organized matches by rounds:", rounds)

    const bracketMatches = []
    const roundKeys = Object.keys(rounds).sort((a, b) => Number(a) - Number(b))

    roundKeys.forEach((roundNum, roundIndex) => {
      const roundMatches = rounds[roundNum].sort((a, b) => a.match_number - b.match_number)

      roundMatches.forEach((match, matchIndex) => {
        const player1Name = getPlayerName(match.player1_id)
        const player2Name = getPlayerName(match.player2_id)

        const totalRounds = Math.max(...roundKeys.map(Number))
        let roundName = `Round ${roundNum}`

        if (Number(roundNum) === totalRounds) {
          roundName = "Winners' Finals"
        } else if (Number(roundNum) === totalRounds - 1) {
          roundName = "Semifinals"
        } else if (Number(roundNum) === totalRounds - 2 && totalRounds > 2) {
          roundName = "Quarterfinals"
        } else if (Number(roundNum) === 1) {
          roundName = "Round 1"
        } else if (Number(roundNum) === 2 && totalRounds > 3) {
          roundName = "Round 2"
        }

        bracketMatches.push({
          id: match.id,
          name: `Match ${match.match_number}`,
          nextMatchId: null,
          tournamentRoundText: roundName,
          startTime: match.scheduled_at || new Date().toISOString(),
          state:
            match.status === "completed"
              ? MATCH_STATES.DONE
              : match.player1_id && match.player2_id
                ? MATCH_STATES.SCHEDULED
                : MATCH_STATES.NO_SHOW,
          participants: [
            {
              id: match.player1_id || `placeholder-${match.id}-1`,
              resultText: match.winner_id === match.player1_id ? "W" : match.player1_score?.toString() || "",
              isWinner: match.winner_id === match.player1_id,
              status: match.player1_id ? null : "NO_SHOW",
              name: player1Name,
            },
            {
              id: match.player2_id || `placeholder-${match.id}-2`,
              resultText: match.winner_id === match.player2_id ? "W" : match.player2_score?.toString() || "",
              isWinner: match.winner_id === match.player2_id,
              status: match.player2_id ? null : "NO_SHOW",
              name: player2Name,
            },
          ],
          // Store original match data for click handling
          originalMatch: match,
        })
      })
    })

    console.log("[v0] Transformed bracket matches:", bracketMatches)
    return bracketMatches
  }

  return (
    <div className="space-y-8">
      {/* Tournament Overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tournament Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{participants.length}</div>
              <div className="text-gray-400 text-sm">Total Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {displayMatches.filter((m) => m.status === "completed").length}
              </div>
              <div className="text-gray-400 text-sm">Completed Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{displayMaxRound}</div>
              <div className="text-gray-400 text-sm">Total Rounds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {tournament.tournament_type?.replace("_", " ").toUpperCase() || "SINGLE ELIMINATION"}
              </div>
              <div className="text-gray-400 text-sm">Format</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match Details Modal */}
      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          currentUser={currentUser}
          onClose={() => setSelectedMatch(null)}
          onResultSubmitted={handleResultSubmitted}
        />
      )}

      {/* Always show bracket - either real or demo */}
      <ProfessionalBracket />

      {/* Generate Bracket Button - only show if no real matches */}
      {isOrganizer && matches.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-bold text-white mb-4">Generate Real Tournament Bracket</h3>
            <p className="text-gray-400 mb-6">
              The bracket above is a preview. Click below to generate the actual tournament bracket with your{" "}
              {participants.length} participants.
            </p>
            <Button
              onClick={generateBracket}
              disabled={loading || participants.length < 2}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Generating..." : `Generate Real Bracket (${participants.length} Players)`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tournament Winner Banner */}
      {displayMaxRound > 0 && displayRounds[displayMaxRound] && displayRounds[displayMaxRound][0]?.winner_id && (
        <Card className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 border-yellow-400 shadow-2xl">
          <CardContent className="pt-6 text-center">
            <Trophy className="w-16 h-16 text-white mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold text-white mb-2">🏆 Tournament Champion! 🏆</h2>
            <p className="text-yellow-100 text-xl font-semibold">
              {getPlayerName(displayRounds[displayMaxRound][0].winner_id)} wins the tournament!
            </p>
            <div className="mt-4 text-yellow-200">Congratulations on an outstanding performance! 🎉</div>
          </CardContent>
        </Card>
      )}

      {/* No Matches Yet */}
      {matches.length === 0 && !isOrganizer && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Bracket Not Generated Yet</h3>
            <p className="text-gray-400">The tournament organizer hasn't generated the bracket yet.</p>
            <p className="text-gray-500 text-sm mt-2">{participants.length} participants are ready to compete!</p>
          </CardContent>
        </Card>
      )}

      {/* Participants List */}
      {participants.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5" />
              Tournament Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {participant.profiles?.username || participant.profiles?.full_name || `Player ${index + 1}`}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Joined {new Date(participant.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
