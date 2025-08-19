"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Calendar, Star } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import { createClient } from "@/lib/supabase/client"

export default function GamesPage() {
  const [gameStats, setGameStats] = useState({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchGameStats = async () => {
      try {
        // Get total registered players
        const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id")

        if (profilesError) throw profilesError

        const totalPlayers = profiles?.length || 0

        // Get tournament statistics by game
        const { data: tournaments, error: tournamentsError } = await supabase.from("tournaments").select(`
            id,
            game,
            status,
            prize_pool,
            current_participants
          `)

        if (tournamentsError) throw tournamentsError

        // Calculate stats per game
        const stats = {}

        // Initialize stats for supported games
        const supportedGames = ["eFootball 2026", "FC Mobile"]
        supportedGames.forEach((game) => {
          stats[game] = {
            activeTournaments: 0,
            totalPlayers: 0,
            prizePool: 0,
          }
        })

        // Process tournament data
        tournaments?.forEach((tournament) => {
          const game = tournament.game
          if (stats[game]) {
            // Count active tournaments (ongoing or upcoming)
            if (tournament.status === "ongoing" || tournament.status === "upcoming") {
              stats[game].activeTournaments++
            }

            // Add participants to total players for this game
            stats[game].totalPlayers += tournament.current_participants || 0

            // Add prize pool (extract number from string like "$15,000")
            if (tournament.prize_pool) {
              const prizeAmount = Number.parseInt(tournament.prize_pool.replace(/[^0-9]/g, "")) || 0
              stats[game].prizePool += prizeAmount
            }
          }
        })

        // If no game-specific data, distribute total players proportionally
        if (stats["eFootball 2026"].totalPlayers === 0 && stats["FC Mobile"].totalPlayers === 0) {
          stats["eFootball 2026"].totalPlayers = Math.floor(totalPlayers * 0.6) // 60% for eFootball
          stats["FC Mobile"].totalPlayers = Math.floor(totalPlayers * 0.4) // 40% for FC Mobile
        }

        setGameStats(stats)
      } catch (error) {
        console.error("Error fetching game stats:", error)
        // Fallback to default values if database query fails
        setGameStats({
          "eFootball 2026": { activeTournaments: 0, totalPlayers: 0, prizePool: 0 },
          "FC Mobile": { activeTournaments: 0, totalPlayers: 0, prizePool: 0 },
        })
      } finally {
        setLoading(false)
      }
    }

    fetchGameStats()
  }, [supabase])

  const supportedGames = [
    {
      id: "efootball2026",
      name: "eFootball 2026",
      description:
        "The latest installment in the eFootball series featuring enhanced gameplay mechanics, realistic player movements, and competitive online modes.",
      image: "/placeholder.svg", // Local placeholder to avoid DNS resolution issues
      category: "Sports",
      platforms: ["PC", "PlayStation", "Xbox", "Mobile"],
      playerCount: "1v1, 2v2, 11v11",
      tournamentModes: ["Single Elimination", "Double Elimination", "Round Robin", "Swiss"],
      activeTournaments: gameStats["eFootball 2026"]?.activeTournaments || 0,
      totalPlayers: gameStats["eFootball 2026"]?.totalPlayers || 0,
      prizePool:
        gameStats["eFootball 2026"]?.prizePool > 0
          ? `$${gameStats["eFootball 2026"].prizePool.toLocaleString()}`
          : "$0",
      featured: true,
      tags: ["Football", "Sports Simulation", "Competitive", "Team-based"],
    },
    {
      id: "fc-mobile",
      name: "FC Mobile",
      description:
        "Mobile football gaming at its finest with intuitive touch controls, quick matches, and competitive leagues designed for on-the-go gaming.",
      image: "/placeholder.svg", // Local placeholder to avoid DNS resolution issues
      category: "Mobile Sports",
      platforms: ["iOS", "Android"],
      playerCount: "1v1, 3v3",
      tournamentModes: ["Single Elimination", "League Format", "Knockout"],
      activeTournaments: gameStats["FC Mobile"]?.activeTournaments || 0,
      totalPlayers: gameStats["FC Mobile"]?.totalPlayers || 0,
      prizePool: gameStats["FC Mobile"]?.prizePool > 0 ? `$${gameStats["FC Mobile"].prizePool.toLocaleString()}` : "$0",
      featured: false,
      tags: ["Mobile", "Football", "Quick Match", "Touch Controls"],
    },
  ]

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="container mx-auto px-4 py-8 pt-20">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Supported Games</h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">Loading game statistics...</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {[1, 2].map((i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 animate-pulse">
                  <div className="h-48 bg-slate-700 rounded-lg mb-4"></div>
                  <div className="h-6 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8 pt-20">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Supported Games</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Compete in tournaments across our carefully curated selection of competitive gaming titles
            </p>
            <div className="flex justify-center items-center mt-6 space-x-4">
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {supportedGames.length} Games Available
              </Badge>
              <Badge variant="outline" className="border-green-500 text-green-400">
                More Games Coming Soon
              </Badge>
            </div>
          </div>

          {/* Games Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {supportedGames.map((game) => (
              <Card
                key={game.id}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 group"
              >
                <CardHeader className="relative">
                  {game.featured && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-yellow-600 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}

                  <div className="w-full h-48 rounded-lg mb-4 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={game.image || "/placeholder.svg"}
                      alt={`${game.name} cover`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <CardTitle className="text-2xl text-white mb-2">{game.name}</CardTitle>
                  <CardDescription className="text-gray-300 text-base leading-relaxed">
                    {game.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Game Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Category</h4>
                      <Badge variant="outline" className="border-slate-600 text-gray-300">
                        {game.category}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Player Modes</h4>
                      <p className="text-sm text-gray-300">{game.playerCount}</p>
                    </div>
                  </div>

                  {/* Platforms */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Platforms</h4>
                    <div className="flex flex-wrap gap-2">
                      {game.platforms.map((platform) => (
                        <Badge key={platform} variant="secondary" className="bg-slate-700 text-gray-300">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tournament Stats */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-700">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Calendar className="w-4 h-4 text-blue-400 mr-1" />
                        <span className="text-lg font-bold text-white">{game.activeTournaments}</span>
                      </div>
                      <p className="text-xs text-gray-400">Active Tournaments</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="w-4 h-4 text-green-400 mr-1" />
                        <span className="text-lg font-bold text-white">{game.totalPlayers.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-400">Total Players</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Trophy className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-lg font-bold text-white">{game.prizePool}</span>
                      </div>
                      <p className="text-xs text-gray-400">Prize Pool</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {game.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-slate-600 text-gray-400 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Link href={`/tournaments?game=${game.id}`} className="flex-1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">View Tournaments</Button>
                    </Link>
                    <Link href={`/tournaments/create?game=${game.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full border-slate-600 text-gray-300 hover:bg-slate-700 bg-transparent"
                      >
                        Create Tournament
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Coming Soon Section */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">More Games Coming Soon</h2>
            <p className="text-gray-400 mb-6">
              We're constantly expanding our platform to support more competitive gaming titles
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                FIFA 24
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                Call of Duty Mobile
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                PUBG Mobile
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                Rocket League
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
