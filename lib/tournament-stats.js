import { createClient } from "@/lib/supabase/client"

export class TournamentStatsService {
  constructor() {
    this.supabase = createClient()
  }

  async getUserStats(userId) {
    try {
      // Get all tournament participations
      const { data: participations, error: participationsError } = await this.supabase
        .from("tournament_participants")
        .select(`
          *,
          tournaments (
            id,
            title,
            game,
            status,
            start_date,
            end_date,
            prize_pool
          )
        `)
        .eq("user_id", userId)

      if (participationsError) throw participationsError

      // Get all matches for the user
      const { data: matches, error: matchesError } = await this.supabase
        .from("matches")
        .select("*")
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order("created_at", { ascending: false })

      if (matchesError) throw matchesError

      // Calculate statistics
      const stats = this.calculateStats(userId, participations || [], matches || [])

      return { success: true, data: stats }
    } catch (error) {
      console.error("Error fetching user stats:", error)
      return { success: false, error: error.message }
    }
  }

  calculateStats(userId, participations, matches) {
    // Basic tournament stats
    const tournamentsParticipated = participations.length
    const completedTournaments = participations.filter((p) => p.tournaments.status === "completed")
    const ongoingTournaments = participations.filter((p) => p.tournaments.status === "ongoing")
    const upcomingTournaments = participations.filter((p) => p.tournaments.status === "upcoming")

    // Match statistics
    const completedMatches = matches.filter((m) => m.status === "completed" && m.winner_id)
    const wins = completedMatches.filter((m) => m.winner_id === userId)
    const losses = completedMatches.filter((m) => m.winner_id && m.winner_id !== userId)

    // Calculate win rate
    const totalGames = wins.length + losses.length
    const winRate = totalGames > 0 ? Math.round((wins.length / totalGames) * 100) : 0

    // Calculate current winning streak
    let currentStreak = 0
    let streakType = "none" // 'win', 'loss', 'none'

    for (const match of completedMatches) {
      if (match.winner_id === userId) {
        if (streakType === "win" || streakType === "none") {
          currentStreak++
          streakType = "win"
        } else {
          break
        }
      } else {
        if (streakType === "loss" || streakType === "none") {
          currentStreak++
          streakType = "loss"
        } else {
          break
        }
      }
    }

    // Get last 5 games with detailed info
    const lastFiveGames = completedMatches.slice(0, 5).map((match) => ({
      id: match.id,
      tournamentId: match.tournament_id,
      isWin: match.winner_id === userId,
      opponent: match.player1_id === userId ? match.player2_id : match.player1_id,
      score:
        match.player1_id === userId
          ? `${match.player1_score}-${match.player2_score}`
          : `${match.player2_score}-${match.player1_score}`,
      completedAt: match.completed_at,
      round: match.round,
    }))

    // Tournament wins (tournaments where user won)
    const tournamentWins = this.calculateTournamentWins(userId, participations, matches)

    // Games by game type
    const gameStats = this.calculateGameStats(participations, matches, userId)

    // Recent performance (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentMatches = completedMatches.filter((m) => new Date(m.completed_at) >= thirtyDaysAgo)
    const recentWins = recentMatches.filter((m) => m.winner_id === userId).length
    const recentWinRate = recentMatches.length > 0 ? Math.round((recentWins / recentMatches.length) * 100) : 0

    return {
      // Tournament participation
      tournamentsParticipated,
      tournamentsWon: tournamentWins,
      tournamentsLost: completedTournaments.length - tournamentWins,

      // Current tournaments
      currentTournaments: [...ongoingTournaments, ...upcomingTournaments].map((p) => p.tournaments),

      // Match statistics
      totalMatches: totalGames,
      matchesWon: wins.length,
      matchesLost: losses.length,
      winRate,

      // Streaks
      currentStreak,
      streakType,

      // Recent games
      lastFiveGames,

      // Performance metrics
      recentWinRate,
      recentMatches: recentMatches.length,

      // Game-specific stats
      gameStats,

      // Additional metrics
      averageScore: this.calculateAverageScore(matches, userId),
      favoriteGame: this.getFavoriteGame(participations),
      totalPrizeMoney: this.calculateTotalPrizes(participations, tournamentWins),
    }
  }

  calculateTournamentWins(userId, participations, matches) {
    let tournamentWins = 0

    for (const participation of participations) {
      if (participation.tournaments.status !== "completed") continue

      // Check if user won the tournament by looking at final matches
      const tournamentMatches = matches.filter((m) => m.tournament_id === participation.tournaments.id)
      const finalMatch = tournamentMatches.filter((m) => m.status === "completed").sort((a, b) => b.round - a.round)[0]

      if (finalMatch && finalMatch.winner_id === userId) {
        tournamentWins++
      }
    }

    return tournamentWins
  }

  calculateGameStats(participations, matches, userId) {
    const gameStats = {}

    participations.forEach((p) => {
      const game = p.tournaments.game
      if (!gameStats[game]) {
        gameStats[game] = {
          tournaments: 0,
          matches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        }
      }
      gameStats[game].tournaments++
    })

    // Add match stats per game
    matches.forEach((match) => {
      const participation = participations.find((p) => p.tournaments.id === match.tournament_id)
      if (!participation) return

      const game = participation.tournaments.game
      if (gameStats[game] && match.status === "completed" && match.winner_id) {
        gameStats[game].matches++
        if (match.winner_id === userId) {
          gameStats[game].wins++
        } else {
          gameStats[game].losses++
        }

        const total = gameStats[game].wins + gameStats[game].losses
        gameStats[game].winRate = total > 0 ? Math.round((gameStats[game].wins / total) * 100) : 0
      }
    })

    return gameStats
  }

  calculateAverageScore(matches, userId) {
    const userMatches = matches.filter(
      (m) => m.status === "completed" && (m.player1_id === userId || m.player2_id === userId),
    )

    if (userMatches.length === 0) return 0

    const totalScore = userMatches.reduce((sum, match) => {
      const userScore = match.player1_id === userId ? match.player1_score : match.player2_score
      return sum + (userScore || 0)
    }, 0)

    return Math.round((totalScore / userMatches.length) * 10) / 10
  }

  getFavoriteGame(participations) {
    const gameCounts = {}
    participations.forEach((p) => {
      const game = p.tournaments.game
      gameCounts[game] = (gameCounts[game] || 0) + 1
    })

    return Object.keys(gameCounts).reduce(
      (a, b) => (gameCounts[a] > gameCounts[b] ? a : b),
      Object.keys(gameCounts)[0] || "None",
    )
  }

  calculateTotalPrizes(participations, tournamentWins) {
    // This is a simplified calculation - in reality you'd need prize distribution data
    const wonTournaments = participations.filter((p) => p.tournaments.status === "completed").slice(0, tournamentWins)

    return wonTournaments.reduce((total, p) => {
      const prizeText = p.tournaments.prize_pool || "$0"
      const prizeAmount = Number.parseInt(prizeText.replace(/[^0-9]/g, "")) || 0
      return total + prizeAmount
    }, 0)
  }

  async getUserRanking(userId) {
    try {
      // Get all users with their win counts for ranking
      const { data: allStats } = await this.supabase.from("matches").select("winner_id").not("winner_id", "is", null)

      if (!allStats) return { rank: 0, totalPlayers: 0 }

      // Count wins per user
      const winCounts = {}
      allStats.forEach((match) => {
        winCounts[match.winner_id] = (winCounts[match.winner_id] || 0) + 1
      })

      const userWins = winCounts[userId] || 0
      const betterPlayers = Object.values(winCounts).filter((wins) => wins > userWins).length

      return {
        rank: betterPlayers + 1,
        totalPlayers: Object.keys(winCounts).length,
        wins: userWins,
      }
    } catch (error) {
      console.error("Error calculating ranking:", error)
      return { rank: 0, totalPlayers: 0, wins: 0 }
    }
  }
}

export const tournamentStats = new TournamentStatsService()
