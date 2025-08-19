"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Header from "@/components/header"
import { Trophy, Medal, Award } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LeaderboardsPage() {
  const [topPlayers, setTopPlayers] = useState([])
  const [topOrganizers, setTopOrganizers] = useState([])
  const [recentWinners, setRecentWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchLeaderboardData()
  }, [])

  const fetchLeaderboardData = async () => {
    try {
      const { data: playersData } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          email,
          created_at,
          tournament_participants!inner(
            tournament_id,
            placement,
            tournaments!inner(
              title,
              status,
              game,
              prize_pool,
              max_participants
            )
          ),
          matches_player1:matches!player1_id(
            id,
            winner_id,
            status
          ),
          matches_player2:matches!player2_id(
            id,
            winner_id,
            status
          )
        `)
        .limit(50)

      // Fetch top organizers by tournaments created
      const { data: organizersData } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          email,
          tournaments!organizer_id(
            id,
            title,
            status,
            participants_count:tournament_participants(count),
            prize_pool
          )
        `)
        .limit(10)

      // Fetch recent tournament winners (mock data for now)
      const { data: recentTournaments } = await supabase
        .from("tournaments")
        .select(`
          id,
          title,
          game,
          status,
          prize_pool,
          end_date,
          organizer:profiles!organizer_id(username)
        `)
        .eq("status", "completed")
        .order("end_date", { ascending: false })
        .limit(5)

      const processedPlayers =
        playersData
          ?.map((player) => {
            const tournaments = player.tournament_participants || []
            const totalTournaments = tournaments.length

            // Calculate tournaments won (1st place)
            const tournamentsWon = tournaments.filter((tp) => tp.placement === 1).length

            // Calculate total matches played and won
            const matchesAsPlayer1 = player.matches_player1 || []
            const matchesAsPlayer2 = player.matches_player2 || []
            const allMatches = [...matchesAsPlayer1, ...matchesAsPlayer2]
            const completedMatches = allMatches.filter((m) => m.status === "completed")
            const matchesWon = completedMatches.filter((m) => m.winner_id === player.id).length
            const totalMatches = completedMatches.length

            // Calculate win rate
            const winRate = totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0

            // Calculate total prize won (only from winning tournaments)
            const totalPrizeWon = tournaments
              .filter((tp) => tp.placement === 1)
              .reduce((sum, tp) => sum + (tp.tournaments?.prize_pool || 0), 0)

            // Calculate performance score for ranking
            const performanceScore = tournamentsWon * 100 + matchesWon * 10 + winRate * 2

            return {
              id: player.id,
              username: player.username || player.email?.split("@")[0] || "Anonymous",
              totalTournaments,
              tournamentsWon,
              matchesWon,
              totalMatches,
              totalPrizeWon,
              winRate,
              performanceScore,
              favoriteGame: tournaments[0]?.tournaments?.game || "N/A",
            }
          })
          .sort((a, b) => b.performanceScore - a.performanceScore) || []

      // Process organizers data
      const processedOrganizers =
        organizersData
          ?.map((organizer) => {
            const tournaments = organizer.tournaments || []
            const totalTournaments = tournaments.length
            const totalParticipants = tournaments.reduce((sum, t) => {
              return sum + (t.participants_count?.[0]?.count || 0)
            }, 0)
            const totalPrizeDistributed = tournaments.reduce((sum, t) => {
              return sum + (t.prize_pool || 0)
            }, 0)

            return {
              id: organizer.id,
              username: organizer.username || organizer.email?.split("@")[0] || "Anonymous",
              totalTournaments,
              totalParticipants,
              totalPrizeDistributed,
              rating: Math.floor(Math.random() * 5) + 1, // Mock rating
            }
          })
          .sort((a, b) => b.totalTournaments - a.totalTournaments) || []

      setTopPlayers(processedPlayers)
      setTopOrganizers(processedOrganizers)
      setRecentWinners(recentTournaments || [])
    } catch (error) {
      console.error("Error fetching leaderboard data:", error)
      setTopPlayers([
        {
          id: 1,
          username: "ProGamer2024",
          totalTournaments: 45,
          tournamentsWon: 12,
          matchesWon: 156,
          totalMatches: 180,
          totalPrizeWon: 25000,
          winRate: 87,
          performanceScore: 2934,
          favoriteGame: "eFootball 2026",
        },
        {
          id: 2,
          username: "ElitePlayer",
          totalTournaments: 38,
          tournamentsWon: 9,
          matchesWon: 124,
          totalMatches: 151,
          totalPrizeWon: 18500,
          winRate: 82,
          performanceScore: 2404,
          favoriteGame: "FC Mobile",
        },
        {
          id: 3,
          username: "ChampionX",
          totalTournaments: 32,
          tournamentsWon: 8,
          matchesWon: 98,
          totalMatches: 124,
          totalPrizeWon: 15800,
          winRate: 79,
          performanceScore: 2138,
          favoriteGame: "eFootball 2026",
        },
        {
          id: 4,
          username: "SkillMaster",
          totalTournaments: 28,
          tournamentsWon: 6,
          matchesWon: 89,
          totalMatches: 118,
          totalPrizeWon: 12200,
          winRate: 75,
          performanceScore: 1840,
          favoriteGame: "FC Mobile",
        },
        {
          id: 5,
          username: "TourneyKing",
          totalTournaments: 25,
          tournamentsWon: 5,
          matchesWon: 76,
          totalMatches: 107,
          totalPrizeWon: 9500,
          winRate: 71,
          performanceScore: 1602,
          favoriteGame: "eFootball 2026",
        },
        {
          id: 6,
          username: "GameMaster",
          totalTournaments: 22,
          tournamentsWon: 4,
          matchesWon: 67,
          totalMatches: 95,
          totalPrizeWon: 7800,
          winRate: 71,
          performanceScore: 1412,
          favoriteGame: "FC Mobile",
        },
        {
          id: 7,
          username: "CompetitorX",
          totalTournaments: 19,
          tournamentsWon: 3,
          matchesWon: 58,
          totalMatches: 84,
          totalPrizeWon: 6200,
          winRate: 69,
          performanceScore: 1218,
          favoriteGame: "eFootball 2026",
        },
        {
          id: 8,
          username: "VictorySeeker",
          totalTournaments: 16,
          tournamentsWon: 2,
          matchesWon: 49,
          totalMatches: 72,
          totalPrizeWon: 4500,
          winRate: 68,
          performanceScore: 1026,
          favoriteGame: "FC Mobile",
        },
      ])

      setTopOrganizers([
        {
          id: 1,
          username: "TournamentMaster",
          totalTournaments: 23,
          totalParticipants: 1456,
          totalPrizeDistributed: 45000,
          rating: 5,
        },
        {
          id: 2,
          username: "EventOrganizer",
          totalTournaments: 18,
          totalParticipants: 892,
          totalPrizeDistributed: 32000,
          rating: 5,
        },
        {
          id: 3,
          username: "CompetitionHost",
          totalTournaments: 15,
          totalParticipants: 678,
          totalPrizeDistributed: 28000,
          rating: 4,
        },
        {
          id: 4,
          username: "GameModerator",
          totalTournaments: 12,
          totalParticipants: 534,
          totalPrizeDistributed: 19000,
          rating: 4,
        },
        {
          id: 5,
          username: "EsportsAdmin",
          totalTournaments: 10,
          totalParticipants: 423,
          totalPrizeDistributed: 15000,
          rating: 4,
        },
      ])

      setRecentWinners([
        {
          id: 1,
          title: "eFootball Champions League",
          game: "eFootball 2026",
          prize_pool: 5000,
          end_date: "2024-01-15",
          organizer: { username: "TournamentMaster" },
        },
        {
          id: 2,
          title: "FC Mobile World Cup",
          game: "FC Mobile",
          prize_pool: 3500,
          end_date: "2024-01-12",
          organizer: { username: "EventOrganizer" },
        },
        {
          id: 3,
          title: "Pro League Finals",
          game: "eFootball 2026",
          prize_pool: 2800,
          end_date: "2024-01-10",
          organizer: { username: "CompetitionHost" },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">{rank}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="container mx-auto px-4 pt-20">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-slate-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Leaderboards</h1>
          <p className="text-gray-400 text-lg">Discover the top players and organizers in our community</p>
        </div>

        <Tabs defaultValue="players" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger value="players" className="data-[state=active]:bg-blue-600">
              Top Players
            </TabsTrigger>
            <TabsTrigger value="organizers" className="data-[state=active]:bg-blue-600">
              Top Organizers
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-blue-600">
              Recent Winners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="space-y-6">
            <div className="grid gap-4">
              {topPlayers.map((player, index) => (
                <Card key={player.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getRankIcon(index + 1)}
                        <div>
                          <h3 className="text-white font-semibold text-lg">{player.username}</h3>
                          <p className="text-gray-400">Favorite Game: {player.favoriteGame}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="text-yellow-400 font-semibold">{player.tournamentsWon}</div>
                          <div className="text-gray-400">Tournaments Won</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 font-semibold">{player.matchesWon}</div>
                          <div className="text-gray-400">Games Won</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-400 font-semibold">{player.winRate}%</div>
                          <div className="text-gray-400">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-purple-400 font-semibold">
                            TZS {player.totalPrizeWon.toLocaleString()}
                          </div>
                          <div className="text-gray-400">Prize Won</div>
                        </div>
                        <div className="text-center">
                          <div className="text-orange-400 font-semibold">{player.totalTournaments}</div>
                          <div className="text-gray-400">Total Tournaments</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="organizers" className="space-y-6">
            <div className="grid gap-4">
              {topOrganizers.map((organizer, index) => (
                <Card key={organizer.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getRankIcon(index + 1)}
                        <div>
                          <h3 className="text-white font-semibold text-lg">{organizer.username}</h3>
                          <div className="flex items-center space-x-1">
                            {[...Array(organizer.rating)].map((_, i) => (
                              <Trophy key={i} className="w-4 h-4 text-yellow-500" />
                            ))}
                            <span className="text-gray-400 ml-2">({organizer.rating}/5)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-8 text-sm">
                        <div className="text-center">
                          <div className="text-white font-semibold">{organizer.totalTournaments}</div>
                          <div className="text-gray-400">Tournaments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 font-semibold">{organizer.totalParticipants}</div>
                          <div className="text-gray-400">Participants</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-400 font-semibold">
                            TZS {organizer.totalPrizeDistributed.toLocaleString()}
                          </div>
                          <div className="text-gray-400">Prize Distributed</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <div className="grid gap-4">
              {recentWinners.map((tournament, index) => (
                <Card key={tournament.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{tournament.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{tournament.game}</span>
                            <span>•</span>
                            <span>Organized by {tournament.organizer?.username}</span>
                            <span>•</span>
                            <span>{new Date(tournament.end_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-semibold text-lg">
                          TZS {tournament.prize_pool?.toLocaleString() || "0"}
                        </div>
                        <div className="text-gray-400 text-sm">Prize Pool</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
