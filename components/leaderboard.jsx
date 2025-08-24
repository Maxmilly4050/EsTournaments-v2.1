"use client"

import { useState, useEffect } from "react"
import { Crown, Trophy, Medal, Target, TrendingUp, Users, RefreshCw, Calendar, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function Leaderboard({ currentUser = null }) {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [playerRanking, setPlayerRanking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [error, setError] = useState(null)

  const ITEMS_PER_PAGE = 50
  const supabase = createClient()

  useEffect(() => {
    fetchLeaderboard()
    if (currentUser) {
      fetchPlayerRanking()
    }
  }, [currentPage, currentUser])

  // Real-time subscription for leaderboard updates
  useEffect(() => {
    const subscription = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_rankings'
        },
        (payload) => {
          console.log('Leaderboard ranking changed:', payload)
          // Refresh leaderboard data when rankings change
          fetchLeaderboard()
          if (currentUser) {
            fetchPlayerRanking()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leaderboard_updates'
        },
        (payload) => {
          console.log('Leaderboard updated:', payload.new)
          // Show a notification or update indicator
          if (payload.new.triggered_by !== 'manual') {
            // Only show automatic updates, not manual ones (user would already see those)
            setTimeout(() => {
              fetchLeaderboard()
              if (currentUser) {
                fetchPlayerRanking()
              }
            }, 1000) // Small delay to ensure database operations are complete
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [currentUser, supabase])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)

      const offset = currentPage * ITEMS_PER_PAGE
      const response = await fetch(`/api/leaderboard?limit=${ITEMS_PER_PAGE}&offset=${offset}`)
      const result = await response.json()

      if (result.success) {
        setLeaderboardData(result.data.leaderboard)
        setTotalPlayers(result.data.totalQualifiedPlayers)
        setTotalPages(Math.ceil(result.data.totalQualifiedPlayers / ITEMS_PER_PAGE))
      } else {
        setError(result.error || 'Failed to fetch leaderboard')
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setError('Failed to load leaderboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayerRanking = async () => {
    if (!currentUser?.id) return

    try {
      const response = await fetch(`/api/leaderboard/player/${currentUser.id}`)
      const result = await response.json()

      if (result.success) {
        setPlayerRanking(result.data)
      }
    } catch (error) {
      console.error('Error fetching player ranking:', error)
    }
  }

  const refreshLeaderboard = async () => {
    if (!currentUser) {
      alert('Please log in to refresh the leaderboard')
      return
    }

    try {
      setRefreshing(true)

      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          triggerReason: 'manual',
          triggerDetails: { userId: currentUser.id, timestamp: new Date().toISOString() }
        })
      })

      const result = await response.json()

      if (result.success) {
        // Refresh the current view
        await fetchLeaderboard()
        if (currentUser) {
          await fetchPlayerRanking()
        }

        alert(`Leaderboard updated successfully in ${result.data.updateDuration}ms`)
      } else {
        alert(result.error || 'Failed to refresh leaderboard')
      }
    } catch (error) {
      console.error('Error refreshing leaderboard:', error)
      alert('Failed to refresh leaderboard')
    } finally {
      setRefreshing(false)
    }
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>
    }
  }

  const getRankBadgeVariant = (rank) => {
    switch (rank) {
      case 1:
        return "default" // Gold
      case 2:
        return "secondary" // Silver
      case 3:
        return "outline" // Bronze
      default:
        return "outline"
    }
  }

  const formatScore = (score) => {
    return score.toFixed(4)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const getStreakDisplay = (streak, streakType) => {
    if (!streak || streak === 0 || streakType === 'none') return null

    return (
      <Badge
        variant={streakType === 'win' ? 'default' : 'destructive'}
        className="text-xs"
      >
        <Zap className="w-3 h-3 mr-1" />
        {streak} {streakType === 'win' ? 'W' : 'L'}
      </Badge>
    )
  }

  const PlayerRankingCard = () => {
    if (!currentUser || !playerRanking) return null

    return (
      <Card className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={playerRanking.avatarUrl} />
                <AvatarFallback className="bg-white text-blue-600 text-xl font-bold">
                  {playerRanking.fullName?.charAt(0) || playerRanking.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{playerRanking.fullName || playerRanking.username}</h3>
                <p className="text-blue-100">Your Ranking</p>
              </div>
            </div>
            <div className="text-right">
              {playerRanking.qualified ? (
                <>
                  <div className="text-3xl font-bold">#{playerRanking.rank}</div>
                  <div className="text-sm text-blue-100">
                    of {playerRanking.totalQualifiedPlayers} qualified players
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold">Not Qualified</div>
                  <div className="text-sm text-blue-100">
                    Need {10 - (playerRanking.totalMatches || 0)} more matches
                  </div>
                </>
              )}
            </div>
          </div>

          {playerRanking.qualified && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold">{playerRanking.winRate?.toFixed(1)}%</div>
                <div className="text-xs text-blue-100">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatScore(playerRanking.leaderboardScore || 0)}</div>
                <div className="text-xs text-blue-100">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{playerRanking.totalMatches}</div>
                <div className="text-xs text-blue-100">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{playerRanking.wins}</div>
                <div className="text-xs text-blue-100">Wins</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="text-red-400 mb-4">
                <Trophy className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Leaderboard Unavailable</h2>
                <p className="text-gray-400">{error}</p>
              </div>
              <Button onClick={fetchLeaderboard} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="px-3 py-1">
                <Users className="w-4 h-4 mr-1" />
                {totalPlayers} Qualified
              </Badge>
              <Button
                onClick={refreshLeaderboard}
                disabled={refreshing || !currentUser}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Updating...' : 'Refresh'}
              </Button>
            </div>
          </div>

          <div className="text-gray-400 text-sm">
            Rankings are based on win rate weighted by total matches played.
            Minimum 10 matches required to qualify.
          </div>
        </div>

        {/* Player's Own Ranking */}
        <PlayerRankingCard />

        {/* Leaderboard */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Global Rankings</span>
              <Badge variant="outline" className="text-xs">
                Page {currentPage + 1} of {totalPages}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {leaderboardData.map((player, index) => (
                  <div key={player.userId} className="p-4 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center justify-center w-12">
                          {getRankIcon(player.rank)}
                        </div>

                        <Avatar className="w-12 h-12">
                          <AvatarImage src={player.avatarUrl} />
                          <AvatarFallback className="bg-slate-600">
                            {player.fullName?.charAt(0) || player.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-semibold">
                              {player.fullName || player.username || 'Unknown Player'}
                            </h3>
                            {player.currentStreak && getStreakDisplay(player.currentStreak, player.streakType)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>@{player.username || 'unknown'}</span>
                            <span>{player.totalMatches} matches</span>
                            <span>Last: {formatDate(player.lastMatchDate)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold text-white">
                          {formatScore(player.leaderboardScore)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {player.winRate.toFixed(1)}% WR
                        </div>
                        <div className="flex items-center justify-end space-x-2 text-xs text-gray-500">
                          <span>{player.wins}W</span>
                          <span>{player.losses}L</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional stats for top 10 */}
                    {player.rank <= 10 && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
                          <div>
                            <span className="text-gray-500">Weight Factor:</span>
                            <span className="text-white ml-1">{player.matchWeightFactor?.toFixed(2) || '0.00'}</span>
                          </div>
                          {player.headToHeadTotal > 0 && (
                            <div>
                              <span className="text-gray-500">H2H:</span>
                              <span className="text-white ml-1">
                                {player.headToHeadWins}/{player.headToHeadTotal}
                              </span>
                            </div>
                          )}
                          {player.averageOpponentStrength > 0 && (
                            <div>
                              <span className="text-gray-500">Avg Opp:</span>
                              <span className="text-white ml-1">
                                {formatScore(player.averageOpponentStrength)}
                              </span>
                            </div>
                          )}
                          {player.recentWinRate30d > 0 && (
                            <div>
                              <span className="text-gray-500">30d:</span>
                              <span className="text-white ml-1">{player.recentWinRate30d.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            >
              Previous
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum
                if (totalPages <= 7) {
                  pageNum = i
                } else if (currentPage <= 3) {
                  pageNum = i
                } else if (currentPage >= totalPages - 4) {
                  pageNum = totalPages - 7 + i
                } else {
                  pageNum = currentPage - 3 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8"
                  >
                    {pageNum + 1}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages - 1}
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
