import { createClient } from "@/lib/supabase/client"

export class LeaderboardService {
  constructor() {
    this.supabase = createClient()
    this.MINIMUM_MATCHES = 10 // Minimum matches required to appear on leaderboard
  }

  /**
   * Calculate leaderboard rankings using the specified algorithm:
   * 1. Win Rate (WR) = Wins / (Wins + Losses) * 100
   * 2. Minimum 10 official matches to qualify
   * 3. Weighted Score = WR × log(1 + Total Matches)
   * 4. Tiebreakers: head-to-head, then average opponent strength
   */
  async calculateLeaderboard(limit = 100, offset = 0) {
    try {
      // Get all completed matches with player data
      const { data: allMatches, error: matchesError } = await this.supabase
        .from("matches")
        .select(`
          *,
          tournaments!inner(status)
        `)
        .eq("status", "completed")
        .not("winner_id", "is", null)
        .eq("tournaments.status", "completed")

      if (matchesError) throw matchesError

      // Get all profiles for user data
      const { data: profiles, error: profilesError } = await this.supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")

      if (profilesError) throw profilesError

      // Calculate stats for each player
      const playerStats = this.calculatePlayerStats(allMatches || [], profiles || [])

      // Filter players who meet minimum match requirement
      const qualifiedPlayers = playerStats.filter(player => player.totalMatches >= this.MINIMUM_MATCHES)

      // Calculate leaderboard scores
      const scoredPlayers = this.calculateLeaderboardScores(qualifiedPlayers, allMatches || [])

      // Sort by score (descending), then apply tiebreakers
      const rankedPlayers = await this.sortWithTiebreakers(scoredPlayers, allMatches || [])

      // Add rank numbers
      const finalLeaderboard = rankedPlayers.map((player, index) => ({
        ...player,
        rank: index + 1
      }))

      // Apply pagination
      const paginatedResults = finalLeaderboard.slice(offset, offset + limit)

      return {
        success: true,
        data: {
          leaderboard: paginatedResults,
          totalPlayers: finalLeaderboard.length,
          totalQualifiedPlayers: qualifiedPlayers.length,
          minimumMatches: this.MINIMUM_MATCHES
        }
      }

    } catch (error) {
      console.error("Error calculating leaderboard:", error)
      return {
        success: false,
        error: "Failed to calculate leaderboard rankings"
      }
    }
  }

  /**
   * Calculate basic stats for each player
   */
  calculatePlayerStats(matches, profiles) {
    const playerStats = {}

    // Initialize stats for all profiles
    profiles.forEach(profile => {
      playerStats[profile.id] = {
        userId: profile.id,
        username: profile.username,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        wins: 0,
        losses: 0,
        totalMatches: 0,
        winRate: 0,
        leaderboardScore: 0
      }
    })

    // Count wins and losses for each player
    matches.forEach(match => {
      const { player1_id, player2_id, winner_id } = match

      // Update player1 stats
      if (playerStats[player1_id]) {
        playerStats[player1_id].totalMatches++
        if (winner_id === player1_id) {
          playerStats[player1_id].wins++
        } else {
          playerStats[player1_id].losses++
        }
      }

      // Update player2 stats
      if (playerStats[player2_id]) {
        playerStats[player2_id].totalMatches++
        if (winner_id === player2_id) {
          playerStats[player2_id].wins++
        } else {
          playerStats[player2_id].losses++
        }
      }
    })

    // Calculate win rates
    Object.values(playerStats).forEach(player => {
      const totalGames = player.wins + player.losses
      player.winRate = totalGames > 0 ? (player.wins / totalGames) * 100 : 0
    })

    return Object.values(playerStats).filter(player => player.totalMatches > 0)
  }

  /**
   * Calculate weighted leaderboard scores using the formula:
   * Score = WR × log(1 + Total Matches)
   */
  calculateLeaderboardScores(players, allMatches) {
    return players.map(player => {
      // Calculate weighted score: WR × log(1 + Total Matches)
      const winRateDecimal = player.winRate / 100 // Convert percentage to decimal
      const matchWeightFactor = Math.log(1 + player.totalMatches)
      const leaderboardScore = winRateDecimal * matchWeightFactor

      return {
        ...player,
        leaderboardScore: Math.round(leaderboardScore * 10000) / 10000, // Round to 4 decimal places
        matchWeightFactor: Math.round(matchWeightFactor * 100) / 100
      }
    })
  }

  /**
   * Sort players with tiebreaker logic:
   * 1. Primary: Leaderboard Score (descending)
   * 2. Tiebreaker 1: Head-to-head record
   * 3. Tiebreaker 2: Average opponent strength
   */
  async sortWithTiebreakers(players, allMatches) {
    // Primary sort by leaderboard score
    let sortedPlayers = players.sort((a, b) => b.leaderboardScore - a.leaderboardScore)

    // Apply tiebreakers for players with same scores
    const groupedByScore = this.groupPlayersByScore(sortedPlayers)
    const finalRanking = []

    for (const group of groupedByScore) {
      if (group.length === 1) {
        finalRanking.push(group[0])
      } else {
        // Apply tiebreakers for tied players
        const rankedGroup = await this.applyTiebreakers(group, allMatches)
        finalRanking.push(...rankedGroup)
      }
    }

    return finalRanking
  }

  /**
   * Group players by identical leaderboard scores
   */
  groupPlayersByScore(players) {
    const groups = []
    let currentGroup = []
    let currentScore = null

    for (const player of players) {
      if (currentScore === null || Math.abs(player.leaderboardScore - currentScore) < 0.0001) {
        currentGroup.push(player)
        currentScore = player.leaderboardScore
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup])
        }
        currentGroup = [player]
        currentScore = player.leaderboardScore
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  /**
   * Apply tiebreaker logic for players with identical scores
   */
  async applyTiebreakers(tiedPlayers, allMatches) {
    // Tiebreaker 1: Head-to-head records
    const playersWithH2H = this.calculateHeadToHead(tiedPlayers, allMatches)

    // Tiebreaker 2: Average opponent strength
    const playersWithOpponentStrength = await this.calculateAverageOpponentStrength(
      playersWithH2H,
      allMatches
    )

    // Final sort with all tiebreakers
    return playersWithOpponentStrength.sort((a, b) => {
      // First tiebreaker: Head-to-head win rate
      if (Math.abs(a.headToHeadWinRate - b.headToHeadWinRate) > 0.001) {
        return b.headToHeadWinRate - a.headToHeadWinRate
      }

      // Second tiebreaker: Average opponent strength
      if (Math.abs(a.averageOpponentStrength - b.averageOpponentStrength) > 0.001) {
        return b.averageOpponentStrength - a.averageOpponentStrength
      }

      // Final fallback: Total wins
      return b.wins - a.wins
    })
  }

  /**
   * Calculate head-to-head records between tied players
   */
  calculateHeadToHead(tiedPlayers, allMatches) {
    const playerIds = tiedPlayers.map(p => p.userId)

    return tiedPlayers.map(player => {
      let h2hWins = 0
      let h2hTotal = 0

      // Find all matches between this player and other tied players
      const relevantMatches = allMatches.filter(match => {
        const isPlayerInMatch = match.player1_id === player.userId || match.player2_id === player.userId
        const opponentId = match.player1_id === player.userId ? match.player2_id : match.player1_id
        const isOpponentTied = playerIds.includes(opponentId)

        return isPlayerInMatch && isOpponentTied
      })

      relevantMatches.forEach(match => {
        h2hTotal++
        if (match.winner_id === player.userId) {
          h2hWins++
        }
      })

      const headToHeadWinRate = h2hTotal > 0 ? (h2hWins / h2hTotal) * 100 : 0

      return {
        ...player,
        headToHeadWins: h2hWins,
        headToHeadTotal: h2hTotal,
        headToHeadWinRate
      }
    })
  }

  /**
   * Calculate average opponent strength (opponent's average leaderboard score)
   */
  async calculateAverageOpponentStrength(players, allMatches) {
    // First, create a map of all player scores for quick lookup
    const allPlayerScores = {}

    // Get all player stats to calculate opponent strengths
    const allPlayerStats = this.calculatePlayerStats(allMatches, await this.getAllProfiles())
    const scoredPlayers = this.calculateLeaderboardScores(allPlayerStats, allMatches)

    scoredPlayers.forEach(player => {
      allPlayerScores[player.userId] = player.leaderboardScore
    })

    return players.map(player => {
      const playerMatches = allMatches.filter(match =>
        match.player1_id === player.userId || match.player2_id === player.userId
      )

      let totalOpponentStrength = 0
      let opponentCount = 0

      playerMatches.forEach(match => {
        const opponentId = match.player1_id === player.userId ? match.player2_id : match.player1_id
        const opponentStrength = allPlayerScores[opponentId] || 0

        totalOpponentStrength += opponentStrength
        opponentCount++
      })

      const averageOpponentStrength = opponentCount > 0 ? totalOpponentStrength / opponentCount : 0

      return {
        ...player,
        averageOpponentStrength: Math.round(averageOpponentStrength * 10000) / 10000
      }
    })
  }

  /**
   * Get all profiles for opponent strength calculations
   */
  async getAllProfiles() {
    const { data: profiles } = await this.supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")

    return profiles || []
  }

  /**
   * Get leaderboard for a specific player
   */
  async getPlayerRanking(userId) {
    try {
      const leaderboardResult = await this.calculateLeaderboard(1000) // Get top 1000 for ranking

      if (!leaderboardResult.success) {
        return { success: false, error: leaderboardResult.error }
      }

      const playerRanking = leaderboardResult.data.leaderboard.find(p => p.userId === userId)

      if (!playerRanking) {
        return {
          success: true,
          data: {
            rank: 0,
            qualified: false,
            reason: "Not enough matches played (minimum 10 required)"
          }
        }
      }

      return {
        success: true,
        data: {
          ...playerRanking,
          qualified: true,
          totalPlayers: leaderboardResult.data.totalQualifiedPlayers
        }
      }

    } catch (error) {
      console.error("Error getting player ranking:", error)
      return { success: false, error: "Failed to get player ranking" }
    }
  }

  /**
   * Refresh leaderboard (can be called after match completion)
   */
  async refreshLeaderboard() {
    // This method can be enhanced to use caching or database triggers
    // For now, it just recalculates the full leaderboard
    return await this.calculateLeaderboard()
  }

  /**
   * Update leaderboard cache in database
   * This method is designed to be called automatically after match completion
   */
  async updateLeaderboardCache(triggerReason = 'automatic', triggerDetails = {}) {
    try {
      console.log(`Starting automatic leaderboard cache update (${triggerReason})...`)
      const startTime = Date.now()

      // Calculate new leaderboard
      const result = await this.calculateLeaderboard(1000) // Get all qualified players

      if (!result.success) {
        console.error('Failed to calculate leaderboard for cache update:', result.error)
        return { success: false, error: result.error }
      }

      // Create a server-side Supabase client for database operations
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const duration = Date.now() - startTime

      // Update database cache
      try {
        // Clear existing rankings
        await supabase.from('leaderboard_rankings').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        // Insert new rankings
        if (result.data.leaderboard.length > 0) {
          const rankingsToInsert = result.data.leaderboard.map(player => ({
            user_id: player.userId,
            rank: player.rank,
            wins: player.wins,
            losses: player.losses,
            total_matches: player.totalMatches,
            win_rate: player.winRate,
            leaderboard_score: player.leaderboardScore,
            match_weight_factor: player.matchWeightFactor || 0,
            head_to_head_wins: player.headToHeadWins || 0,
            head_to_head_total: player.headToHeadTotal || 0,
            head_to_head_win_rate: player.headToHeadWinRate || 0,
            average_opponent_strength: player.averageOpponentStrength || 0,
            is_qualified: true,
            last_updated: new Date().toISOString()
          }))

          const { error: insertError } = await supabase
            .from('leaderboard_rankings')
            .insert(rankingsToInsert)

          if (insertError) {
            console.error('Error caching leaderboard rankings:', insertError)
            throw insertError
          }
        }

        // Log the update
        await supabase
          .from('leaderboard_updates')
          .insert({
            total_players: result.data.totalPlayers,
            qualified_players: result.data.totalQualifiedPlayers,
            update_duration_ms: duration,
            triggered_by: triggerReason,
            trigger_details: triggerDetails
          })

        console.log(`Leaderboard cache updated successfully in ${duration}ms`)

        return {
          success: true,
          data: {
            ...result.data,
            updateDuration: duration
          }
        }

      } catch (cacheError) {
        console.error('Error updating leaderboard cache:', cacheError)
        return { success: false, error: 'Failed to update database cache' }
      }

    } catch (error) {
      console.error('Error in automatic leaderboard update:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Method to be called when a match is completed
   * Updates individual player stats and optionally triggers full leaderboard recalculation
   */
  async onMatchCompleted(matchId, player1Id, player2Id, winnerId, shouldUpdateFullLeaderboard = false) {
    try {
      console.log(`Match ${matchId} completed: ${winnerId} won against ${winnerId === player1Id ? player2Id : player1Id}`)

      // The database trigger should already have updated player_match_stats
      // But we can trigger a full leaderboard update if needed

      if (shouldUpdateFullLeaderboard) {
        return await this.updateLeaderboardCache('match_completion', {
          matchId,
          player1Id,
          player2Id,
          winnerId,
          timestamp: new Date().toISOString()
        })
      }

      return { success: true, message: 'Player stats updated via database trigger' }
    } catch (error) {
      console.error('Error handling match completion:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Check if leaderboard cache needs updating based on last update time
   */
  async needsCacheUpdate(maxAgeMinutes = 30) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const { data: lastUpdate } = await supabase
        .from('leaderboard_updates')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!lastUpdate) {
        return true // No updates yet, definitely needs update
      }

      const lastUpdateTime = new Date(lastUpdate.created_at)
      const now = new Date()
      const ageMinutes = (now - lastUpdateTime) / (1000 * 60)

      return ageMinutes > maxAgeMinutes
    } catch (error) {
      console.error('Error checking cache age:', error)
      return true // If we can't check, assume it needs update
    }
  }

  /**
   * Smart cache update - only updates if cache is stale
   */
  async smartCacheUpdate() {
    const needsUpdate = await this.needsCacheUpdate(15) // 15 minutes

    if (needsUpdate) {
      return await this.updateLeaderboardCache('scheduled', {
        reason: 'cache_too_old',
        timestamp: new Date().toISOString()
      })
    }

    return { success: true, message: 'Cache is still fresh, no update needed' }
  }
}

export const leaderboardService = new LeaderboardService()
