"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { tournamentStats } from "@/lib/tournament-stats"
import { FriendsManagement } from "@/components/friends-management"
import { GroupsManagement } from "@/components/groups-management"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Trophy, Calendar, TrendingUp, Settings, Target, Award, Gamepad2 } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [ranking, setRanking] = useState({ rank: 0, totalPlayers: 0 })
  const [friends, setFriends] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        setUser(user)

        // Fetch user profile
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(profileData)

        // Fetch comprehensive tournament statistics
        const statsResult = await tournamentStats.getUserStats(user.id)
        if (statsResult.success) {
          setStats(statsResult.data)
        }

        // Fetch user ranking
        const rankingData = await tournamentStats.getUserRanking(user.id)
        setRanking(rankingData)

        // Fetch friends and groups when implemented
        setFriends([])
        setGroups([])
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-48 bg-slate-800 rounded-lg"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-800 rounded-lg"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 bg-slate-800 rounded-lg"></div>
                <div className="h-64 bg-slate-800 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 80px)" }}>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-gray-300 mb-4">Please log in to view your profile</p>
              <Link href="/auth/login">
                <Button className="bg-blue-600 hover:bg-blue-700">Log In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-blue-600 text-white text-xl">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{profile?.full_name || user.email}</h1>
                    <p className="text-gray-400">{user.email}</p>
                    {profile?.phone_number && <p className="text-gray-400">{profile.phone_number}</p>}
                    <div className="flex items-center space-x-2 mt-2">
                      {stats?.streakType === "win" && stats?.currentStreak > 0 && (
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          <Trophy className="w-3 h-3 mr-1" />
                          {stats.currentStreak} Win Streak
                        </Badge>
                      )}
                      {ranking.rank > 0 && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                          <Award className="w-3 h-3 mr-1" />
                          Rank #{ranking.rank}
                        </Badge>
                      )}
                      {stats?.favoriteGame && (
                        <Badge variant="outline" className="border-blue-500 text-blue-400">
                          <Gamepad2 className="w-3 h-3 mr-1" />
                          {stats.favoriteGame}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Link href="/profile/edit">
                  <Button variant="outline" className="border-slate-600 text-gray-300 bg-transparent">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats?.tournamentsParticipated || 0}</div>
                <div className="text-sm text-gray-400">Tournaments</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats?.tournamentsWon || 0}</div>
                <div className="text-sm text-gray-400">Tournaments Won</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats?.matchesWon || 0}</div>
                <div className="text-sm text-gray-400">Matches Won</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats?.winRate || 0}%</div>
                <div className="text-sm text-gray-400">Win Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{stats?.currentTournaments?.length || 0}</div>
                <div className="text-sm text-gray-400">Active</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
                Overview
              </TabsTrigger>
              <TabsTrigger value="statistics" className="data-[state=active]:bg-slate-700">
                Statistics
              </TabsTrigger>
              <TabsTrigger value="tournaments" className="data-[state=active]:bg-slate-700">
                Tournaments
              </TabsTrigger>
              <TabsTrigger value="friends" className="data-[state=active]:bg-slate-700">
                Friends
              </TabsTrigger>
              <TabsTrigger value="groups" className="data-[state=active]:bg-slate-700">
                Groups
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Games */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Last 5 Games
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.lastFiveGames?.length > 0 ? (
                      <div className="space-y-2">
                        {stats.lastFiveGames.map((game, index) => (
                          <div key={game.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                            <div>
                              <span className="text-gray-300">Round {game.round}</span>
                              <p className="text-sm text-gray-400">Score: {game.score}</p>
                            </div>
                            <Badge
                              variant={game.isWin ? "default" : "destructive"}
                              className={game.isWin ? "bg-green-600" : "bg-red-600"}
                            >
                              {game.isWin ? "Won" : "Lost"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No recent games</p>
                    )}
                  </CardContent>
                </Card>

                {/* Current Tournaments */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Active Tournaments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.currentTournaments?.length > 0 ? (
                      <div className="space-y-2">
                        {stats.currentTournaments.map((tournament) => (
                          <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                            <div className="p-3 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                              <h4 className="text-white font-medium">{tournament.title}</h4>
                              <p className="text-gray-400 text-sm">{tournament.game}</p>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {tournament.status}
                                </Badge>
                                {tournament.prize_pool && (
                                  <span className="text-green-400 text-sm">{tournament.prize_pool}</span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No active tournaments</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Overall Win Rate</span>
                        <span className="text-white">{stats?.winRate || 0}%</span>
                      </div>
                      <Progress value={stats?.winRate || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Recent Win Rate (30 days)</span>
                        <span className="text-white">{stats?.recentWinRate || 0}%</span>
                      </div>
                      <Progress value={stats?.recentWinRate || 0} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">{stats?.averageScore || 0}</div>
                        <div className="text-xs text-gray-400">Avg Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-400">#{ranking.rank || 0}</div>
                        <div className="text-xs text-gray-400">Global Rank</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Game Statistics */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Gamepad2 className="w-5 h-5 mr-2" />
                      Game Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.gameStats && Object.keys(stats.gameStats).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(stats.gameStats).map(([game, gameStats]) => (
                          <div key={game} className="p-3 bg-slate-700 rounded">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-white font-medium">{game}</h4>
                              <Badge variant="outline" className="text-xs">
                                {gameStats.winRate}% WR
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="text-center">
                                <div className="text-blue-400">{gameStats.tournaments}</div>
                                <div className="text-gray-400 text-xs">Tournaments</div>
                              </div>
                              <div className="text-center">
                                <div className="text-green-400">{gameStats.wins}</div>
                                <div className="text-gray-400 text-xs">Wins</div>
                              </div>
                              <div className="text-center">
                                <div className="text-red-400">{gameStats.losses}</div>
                                <div className="text-gray-400 text-xs">Losses</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No game statistics available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tournaments">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Tournament History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Detailed tournament history will be displayed here</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="friends">{user && <FriendsManagement userId={user.id} />}</TabsContent>

            <TabsContent value="groups">{user && <GroupsManagement userId={user.id} />}</TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
