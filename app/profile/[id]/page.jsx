"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { tournamentStats } from "@/lib/tournament-stats"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Trophy, Calendar, TrendingUp, Target, Award, Gamepad2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default async function UserProfilePage({ params }) {
  const resolvedParams = await params

  return <UserProfilePageClient userId={resolvedParams.id} />
}

function UserProfilePageClient({ userId }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [ranking, setRanking] = useState({ rank: 0, totalPlayers: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  const supabase = createClient()

  // Validate UUID format
  const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Validate UUID format first
        if (!isValidUUID(userId)) {
          setError("Invalid user ID format")
          setLoading(false)
          return
        }

        // Get current user for comparison
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        setCurrentUser(currentUser)

        // Check if viewing own profile - redirect to main profile page
        if (currentUser && currentUser.id === userId) {
          router.replace("/profile")
          return
        }

        // Fetch target user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (profileError || !profileData) {
          setError("User not found")
          setLoading(false)
          return
        }

        setProfile(profileData)

        // Fetch comprehensive tournament statistics
        const statsResult = await tournamentStats.getUserStats(userId)
        if (statsResult.success) {
          setStats(statsResult.data)
        }

        // Fetch user ranking
        const rankingData = await tournamentStats.getUserRanking(userId)
        setRanking(rankingData)

      } catch (error) {
        console.error("Error fetching user data:", error)
        setError("Failed to load user profile")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUserData()
    }
  }, [userId, supabase, router])

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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 80px)" }}>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-gray-300 mb-4">{error}</p>
              <Link href="/tournaments">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tournaments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 80px)" }}>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-gray-300 mb-4">User profile not found</p>
              <Link href="/tournaments">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tournaments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "U"
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-6 bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback className="text-2xl bg-blue-600">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-white">{profile.full_name}</h1>
                      <p className="text-xl text-gray-400">@{profile.username}</p>
                      {profile.gamer_tag && (
                        <p className="text-lg text-blue-400">🎮 {profile.gamer_tag}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">#{ranking.rank || "Unranked"}</div>
                        <div className="text-sm text-gray-400">Global Ranking</div>
                      </div>
                    </div>
                  </div>
                  {profile.bio && (
                    <p className="text-gray-300 mt-4">{profile.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{stats?.tournamentsWon || 0}</div>
                    <div className="text-sm text-gray-400">Tournaments Won</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{stats?.matchesWon || 0}</div>
                    <div className="text-sm text-gray-400">Matches Won</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{stats?.tournamentsParticipated || 0}</div>
                    <div className="text-sm text-gray-400">Tournaments</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {stats?.winRate ? Math.round(stats.winRate * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tournament History */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Tournament Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tournaments Played</span>
                    <span className="text-white font-semibold">{stats?.tournamentsParticipated || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tournaments Won</span>
                    <span className="text-yellow-400 font-semibold">{stats?.tournamentsWon || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tournament Win Rate</span>
                    <span className="text-green-400 font-semibold">
                      {stats?.tournamentsParticipated > 0
                        ? Math.round((stats.tournamentsWon / stats.tournamentsParticipated) * 100) + "%"
                        : "0%"}
                    </span>
                  </div>
                  {stats?.tournamentsParticipated > 0 && (
                    <Progress
                      value={(stats.tournamentsWon / stats.tournamentsParticipated) * 100}
                      className="w-full mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Match Statistics */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Match Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Matches Played</span>
                    <span className="text-white font-semibold">{stats?.totalMatches || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Matches Won</span>
                    <span className="text-green-400 font-semibold">{stats?.matchesWon || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Match Win Rate</span>
                    <span className="text-blue-400 font-semibold">
                      {stats?.winRate ? Math.round(stats.winRate * 100) + "%" : "0%"}
                    </span>
                  </div>
                  {stats?.winRate && (
                    <Progress
                      value={stats.winRate * 100}
                      className="w-full mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Back to Profile Button */}
          <div className="mt-6 text-center">
            <Link href="/tournaments">
              <Button variant="outline" className="bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tournaments
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
