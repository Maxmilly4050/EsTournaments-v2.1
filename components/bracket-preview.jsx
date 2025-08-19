import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Play, User, Crown, Target } from "lucide-react"
import Link from "next/link"

export function BracketPreview({ tournament }) {
  const participants = tournament.tournament_participants || []
  const matches = tournament.matches || []

  // Calculate bracket structure based on participants
  const numParticipants = participants.length
  const maxParticipants = tournament.max_participants || 16
  const numRounds = Math.ceil(Math.log2(maxParticipants))

  // Seeding logic - assign seeds based on join order or random for preview
  const getSeededParticipants = () => {
    return participants.map((participant, index) => ({
      ...participant,
      seed: index + 1,
      rating: Math.floor(Math.random() * 100) + 50, // Mock rating for prediction
      name: participant.profiles?.username || participant.profiles?.full_name || `Player ${index + 1}`,
    }))
  }

  // Generate bracket tree structure
  const generateBracketTree = () => {
    const seededParticipants = getSeededParticipants()
    const bracketSize = Math.pow(2, numRounds)
    const bracket = []

    // Initialize first round with seeded matchups
    const firstRound = []
    for (let i = 0; i < bracketSize / 2; i++) {
      const player1 = seededParticipants[i * 2]
      const player2 = seededParticipants[i * 2 + 1]

      // Calculate win probability based on mock ratings
      const p1Rating = player1?.rating || 50
      const p2Rating = player2?.rating || 50
      const p1WinProb = p1Rating / (p1Rating + p2Rating)

      firstRound.push({
        id: `match-1-${i}`,
        round: 1,
        position: i,
        player1: player1
          ? {
              name: player1.name,
              seed: player1.seed,
              id: player1.user_id,
              winProbability: Math.round(p1WinProb * 100),
            }
          : null,
        player2: player2
          ? {
              name: player2.name,
              seed: player2.seed,
              id: player2.user_id,
              winProbability: Math.round((1 - p1WinProb) * 100),
            }
          : null,
        winner: null,
        status: numParticipants >= 2 ? "pending" : "waiting",
      })
    }
    bracket.push(firstRound)

    // Generate subsequent rounds
    for (let round = 2; round <= numRounds; round++) {
      const roundMatches = []
      const prevRound = bracket[round - 2]

      for (let i = 0; i < prevRound.length / 2; i++) {
        roundMatches.push({
          id: `match-${round}-${i}`,
          round,
          position: i,
          player1: null,
          player2: null,
          winner: null,
          status: "waiting",
          dependsOn: [prevRound[i * 2].id, prevRound[i * 2 + 1].id],
        })
      }
      bracket.push(roundMatches)
    }

    return bracket
  }

  const bracketTree = generateBracketTree()
  const hasGeneratedBracket = matches.length > 0

  const getRoundName = (round, totalRounds) => {
    if (round === totalRounds) return "Final"
    if (round === totalRounds - 1) return "Semi-Final"
    if (round === totalRounds - 2) return "Quarter-Final"
    return `Round ${round}`
  }

  const getMatchStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "border-green-500 bg-green-900/20"
      case "pending":
        return "border-yellow-500 bg-yellow-900/20"
      case "waiting":
        return "border-slate-600 bg-slate-800/50"
      default:
        return "border-slate-600 bg-slate-700"
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Tournament Bracket
            {tournament.tournament_type === "single_elimination" && (
              <Badge variant="outline" className="text-xs">
                Single Elimination
              </Badge>
            )}
          </div>
          {hasGeneratedBracket && (
            <Link href={`/tournaments/${tournament.id}/bracket`}>
              <Badge className="bg-blue-600 hover:bg-blue-700 cursor-pointer">View Full Bracket</Badge>
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tournament Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {numParticipants}/{maxParticipants}
            </div>
            <div className="text-gray-400 text-xs">Participants</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{numRounds}</div>
            <div className="text-gray-400 text-xs">Rounds</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{Math.pow(2, numRounds - 1)}</div>
            <div className="text-gray-400 text-xs">First Round</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">
              {tournament.prize_pool ? tournament.prize_pool.split(" ")[0] : "0"}
            </div>
            <div className="text-gray-400 text-xs">Prize Pool</div>
          </div>
        </div>

        {/* Bracket Tree Visualization */}
        <div className="overflow-x-auto">
          <div className="flex gap-8 min-w-max pb-4">
            {bracketTree.map((round, roundIndex) => (
              <div key={roundIndex} className="flex flex-col items-center space-y-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">{getRoundName(roundIndex + 1, numRounds)}</h4>
                <div className="space-y-6">
                  {round.map((match, matchIndex) => (
                    <div key={match.id} className="relative">
                      <div className={`w-48 p-3 rounded-lg border-2 ${getMatchStatusColor(match.status)}`}>
                        {/* Player 1 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {match.player1?.seed && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {match.player1.seed}
                              </Badge>
                            )}
                            <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-white text-sm truncate">{match.player1?.name || "TBD"}</span>
                          </div>
                          {match.player1?.winProbability && (
                            <span className="text-xs text-blue-400 ml-2">{match.player1.winProbability}%</span>
                          )}
                        </div>

                        {/* VS Divider */}
                        <div className="flex items-center justify-center py-1">
                          <div className="w-full h-px bg-slate-600"></div>
                          <span className="px-2 text-xs text-gray-500 bg-slate-800">vs</span>
                          <div className="w-full h-px bg-slate-600"></div>
                        </div>

                        {/* Player 2 */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {match.player2?.seed && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {match.player2.seed}
                              </Badge>
                            )}
                            <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-white text-sm truncate">{match.player2?.name || "TBD"}</span>
                          </div>
                          {match.player2?.winProbability && (
                            <span className="text-xs text-blue-400 ml-2">{match.player2.winProbability}%</span>
                          )}
                        </div>

                        {/* Match Status */}
                        {match.status === "completed" && (
                          <div className="mt-2 pt-2 border-t border-slate-600">
                            <div className="flex items-center justify-center gap-1 text-green-400">
                              <Crown className="w-3 h-3" />
                              <span className="text-xs">Winner Advances</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Connection Lines to Next Round */}
                      {roundIndex < bracketTree.length - 1 && (
                        <div className="absolute top-1/2 -right-4 w-8 h-px bg-slate-600 transform -translate-y-1/2">
                          <div className="absolute right-0 top-0 w-2 h-2 bg-slate-600 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bracket Legend */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-green-500 bg-green-900/20 rounded"></div>
              <span className="text-gray-400">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-yellow-500 bg-yellow-900/20 rounded"></div>
              <span className="text-gray-400">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-slate-600 bg-slate-800/50 rounded"></div>
              <span className="text-gray-400">Waiting</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 text-blue-400" />
              <span className="text-gray-400">Win Probability</span>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-4 text-center">
          {!hasGeneratedBracket ? (
            <div className="text-gray-400 text-sm">
              <Play className="w-4 h-4 inline mr-1" />
              {numParticipants >= 2
                ? "Bracket will be generated when tournament starts"
                : `Need ${2 - numParticipants} more participant${2 - numParticipants === 1 ? "" : "s"} to start`}
            </div>
          ) : (
            <div className="text-green-400 text-sm">
              <Trophy className="w-4 h-4 inline mr-1" />
              Tournament bracket is active
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
