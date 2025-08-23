/**
 * Tournament Bracket Generation Service
 * Handles creation of brackets and schedules for all tournament formats
 */
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()

export class TournamentBracketGenerator {
  /**
   * Generate tournament bracket/schedule based on format
   * @param {string} tournamentId - Tournament UUID
   * @param {Array} participants - Array of participant objects
   * @param {Object} tournamentConfig - Tournament configuration
   */
  async generateTournament(tournamentId, participants, tournamentConfig) {
    const { tournament_type, bracket_type = 'standard' } = tournamentConfig

    // Validate participant count
    if (participants.length < 2) {
      throw new Error('Tournament requires at least 2 participants')
    }

    if (participants.length > 128) {
      throw new Error('Tournament supports maximum 128 participants')
    }

    // Seed participants if needed
    let seededParticipants = this.seedParticipants(participants, bracket_type)

    switch (tournament_type) {
      case 'single_elimination':
        return await this.generateSingleElimination(tournamentId, seededParticipants)
      case 'double_elimination':
        return await this.generateDoubleElimination(tournamentId, seededParticipants)
      case 'round_robin':
        return await this.generateRoundRobin(tournamentId, seededParticipants)
      case 'group_stage':
        return await this.generateGroupStage(tournamentId, seededParticipants, tournamentConfig)
      case 'custom':
        return await this.generateCustomFormat(tournamentId, seededParticipants, tournamentConfig)
      default:
        throw new Error(`Unsupported tournament type: ${tournament_type}`)
    }
  }

  /**
   * Seed participants based on bracket type
   */
  seedParticipants(participants, bracketType) {
    switch (bracketType) {
      case 'seeded':
        // Sort by skill rating if available, otherwise by join date
        return participants.sort((a, b) => {
          if (a.skill_rating && b.skill_rating) {
            return b.skill_rating - a.skill_rating
          }
          return new Date(a.joined_at) - new Date(b.joined_at)
        })
      case 'random':
        return this.shuffleArray([...participants])
      default:
        return participants
    }
  }

  /**
   * Generate single elimination bracket
   */
  async generateSingleElimination(tournamentId, participants) {
    const bracketSize = this.getNextPowerOfTwo(participants.length)
    const rounds = Math.log2(bracketSize)
    const matches = []

    // Create bracket structure
    let currentRound = 1
    let matchNumber = 1

    // First round with byes if needed
    const firstRoundMatches = bracketSize / 2
    const byes = bracketSize - participants.length

    for (let i = 0; i < firstRoundMatches; i++) {
      const player1Index = i * 2
      const player2Index = i * 2 + 1

      const match = {
        tournament_id: tournamentId,
        round: currentRound,
        match_number: matchNumber++,
        match_type: 'knockout',
        bracket_position: `R${currentRound}M${i + 1}`,
        player1_id: participants[player1Index]?.user_id || null,
        player2_id: participants[player2Index]?.user_id || null,
        is_bye: player2Index >= participants.length,
        status: player2Index >= participants.length ? 'completed' : 'pending'
      }

      // If it's a bye, set winner
      if (match.is_bye) {
        match.winner_id = match.player1_id
      }

      matches.push(match)
    }

    // Generate remaining rounds
    let previousRoundMatches = firstRoundMatches
    for (let round = 2; round <= rounds; round++) {
      const roundMatches = previousRoundMatches / 2

      for (let i = 0; i < roundMatches; i++) {
        const match = {
          tournament_id: tournamentId,
          round: round,
          match_number: matchNumber++,
          match_type: round === rounds ? 'final' : 'knockout',
          bracket_position: `R${round}M${i + 1}`,
          player1_id: null,
          player2_id: null,
          status: 'pending'
        }

        matches.push(match)
      }

      previousRoundMatches = roundMatches
    }

    return await this.saveMatches(matches)
  }

  /**
   * Generate double elimination bracket
   */
  async generateDoubleElimination(tournamentId, participants) {
    const bracketSize = this.getNextPowerOfTwo(participants.length)
    const rounds = Math.log2(bracketSize)
    const matches = []
    let matchNumber = 1

    // Winners bracket - same as single elimination
    const winnersMatches = await this.generateWinnersBracket(
      tournamentId, participants, rounds, matchNumber
    )
    matches.push(...winnersMatches)
    matchNumber += winnersMatches.length

    // Losers bracket - more complex structure
    const losersMatches = await this.generateLosersBracket(
      tournamentId, rounds, matchNumber
    )
    matches.push(...losersMatches)
    matchNumber += losersMatches.length

    // Grand final
    const grandFinal = {
      tournament_id: tournamentId,
      round: rounds + Math.log2(bracketSize) - 1,
      match_number: matchNumber,
      match_type: 'grand_final',
      bracket_position: 'GF',
      player1_id: null, // Winner of winners bracket
      player2_id: null, // Winner of losers bracket
      status: 'pending'
    }
    matches.push(grandFinal)

    return await this.saveMatches(matches)
  }

  /**
   * Generate winners bracket for double elimination
   */
  async generateWinnersBracket(tournamentId, participants, rounds, startingMatchNumber) {
    const matches = []
    const bracketSize = this.getNextPowerOfTwo(participants.length)
    let matchNumber = startingMatchNumber

    // First round
    const firstRoundMatches = bracketSize / 2
    for (let i = 0; i < firstRoundMatches; i++) {
      const player1Index = i * 2
      const player2Index = i * 2 + 1

      const match = {
        tournament_id: tournamentId,
        round: 1,
        match_number: matchNumber++,
        match_type: 'winners_bracket',
        bracket_position: `WR1M${i + 1}`,
        player1_id: participants[player1Index]?.user_id || null,
        player2_id: participants[player2Index]?.user_id || null,
        is_bye: player2Index >= participants.length,
        status: player2Index >= participants.length ? 'completed' : 'pending'
      }

      if (match.is_bye) {
        match.winner_id = match.player1_id
      }

      matches.push(match)
    }

    // Subsequent rounds
    let previousRoundMatches = firstRoundMatches
    for (let round = 2; round <= rounds; round++) {
      const roundMatches = previousRoundMatches / 2

      for (let i = 0; i < roundMatches; i++) {
        const match = {
          tournament_id: tournamentId,
          round: round,
          match_number: matchNumber++,
          match_type: 'winners_bracket',
          bracket_position: `WR${round}M${i + 1}`,
          player1_id: null,
          player2_id: null,
          status: 'pending'
        }

        matches.push(match)
      }

      previousRoundMatches = roundMatches
    }

    return matches
  }

  /**
   * Generate losers bracket for double elimination
   */
  async generateLosersBracket(tournamentId, winnersRounds, startingMatchNumber) {
    const matches = []
    let matchNumber = startingMatchNumber

    // Losers bracket has (2 * winnersRounds - 2) rounds
    const losersRounds = (2 * winnersRounds) - 2

    for (let round = 1; round <= losersRounds; round++) {
      // Calculate matches per round (complex pattern for losers bracket)
      const matchesInRound = this.calculateLosersBracketMatches(round, winnersRounds)

      for (let i = 0; i < matchesInRound; i++) {
        const match = {
          tournament_id: tournamentId,
          round: winnersRounds + round,
          match_number: matchNumber++,
          match_type: 'losers_bracket',
          bracket_position: `LR${round}M${i + 1}`,
          player1_id: null,
          player2_id: null,
          status: 'pending'
        }

        matches.push(match)
      }
    }

    return matches
  }

  /**
   * Generate round robin schedule
   */
  async generateRoundRobin(tournamentId, participants) {
    const matches = []
    let matchNumber = 1
    const rounds = participants.length - 1

    // Generate all possible pairings
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const match = {
          tournament_id: tournamentId,
          round: Math.ceil(matchNumber / (participants.length / 2)),
          match_number: matchNumber++,
          match_type: 'group',
          player1_id: participants[i].user_id,
          player2_id: participants[j].user_id,
          status: 'pending'
        }

        matches.push(match)
      }
    }

    return await this.saveMatches(matches)
  }

  /**
   * Generate group stage tournament
   */
  async generateGroupStage(tournamentId, participants, config) {
    const { group_count = 4, teams_per_group = 4, knockout_stage_teams = 2 } = config
    const matches = []
    let matchNumber = 1

    // Create groups
    const groups = await this.createGroups(tournamentId, participants, group_count, teams_per_group)

    // Generate round robin within each group
    for (const group of groups) {
      const groupParticipants = group.participants

      // Round robin within group
      for (let i = 0; i < groupParticipants.length; i++) {
        for (let j = i + 1; j < groupParticipants.length; j++) {
          const match = {
            tournament_id: tournamentId,
            round: 1, // Group stage is round 1
            match_number: matchNumber++,
            match_type: 'group',
            group_id: group.id,
            player1_id: groupParticipants[i].user_id,
            player2_id: groupParticipants[j].user_id,
            status: 'pending'
          }

          matches.push(match)
        }
      }
    }

    // Generate knockout stage bracket for top teams
    const knockoutParticipants = group_count * knockout_stage_teams
    const knockoutMatches = await this.generateKnockoutStage(
      tournamentId, knockoutParticipants, matchNumber
    )
    matches.push(...knockoutMatches)

    return await this.saveMatches(matches)
  }

  /**
   * Generate custom format tournament
   */
  async generateCustomFormat(tournamentId, participants, config) {
    const { custom_rules } = config

    // This is a flexible system - implement based on custom_rules
    // For now, default to single elimination with custom settings
    if (custom_rules.format === 'mixed') {
      // Implement mixed format (group stage + knockout)
      return await this.generateGroupStage(tournamentId, participants, custom_rules)
    } else {
      // Default to single elimination
      return await this.generateSingleElimination(tournamentId, participants)
    }
  }

  /**
   * Helper methods
   */
  getNextPowerOfTwo(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)))
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  calculateLosersBracketMatches(round, winnersRounds) {
    // Complex calculation for losers bracket structure
    if (round === 1) {
      return Math.pow(2, winnersRounds - 2)
    } else if (round % 2 === 0) {
      return Math.pow(2, winnersRounds - Math.floor(round / 2) - 2)
    } else {
      return Math.pow(2, winnersRounds - Math.ceil(round / 2) - 1)
    }
  }

  async createGroups(tournamentId, participants, groupCount, teamsPerGroup) {
    const groups = []
    const participantsPerGroup = Math.ceil(participants.length / groupCount)

    for (let i = 0; i < groupCount; i++) {
      const groupName = String.fromCharCode(65 + i) // A, B, C, etc.
      const startIndex = i * participantsPerGroup
      const endIndex = Math.min(startIndex + participantsPerGroup, participants.length)
      const groupParticipants = participants.slice(startIndex, endIndex)

      // Create group in database
      const { data: group, error } = await supabase
        .from('tournament_groups')
        .insert({
          tournament_id: tournamentId,
          group_name: groupName,
          group_index: i
        })
        .select()
        .single()

      if (error) throw error

      // Add participants to group
      const groupParticipantInserts = groupParticipants.map(p => ({
        group_id: group.id,
        user_id: p.user_id
      }))

      await supabase
        .from('group_participants')
        .insert(groupParticipantInserts)

      groups.push({
        ...group,
        participants: groupParticipants
      })
    }

    return groups
  }

  async generateKnockoutStage(tournamentId, participantCount, startingMatchNumber) {
    const matches = []
    let matchNumber = startingMatchNumber
    const rounds = Math.log2(participantCount)

    let currentRoundMatches = participantCount / 2
    for (let round = 2; round <= rounds + 1; round++) {
      for (let i = 0; i < currentRoundMatches; i++) {
        const match = {
          tournament_id: tournamentId,
          round: round,
          match_number: matchNumber++,
          match_type: 'knockout',
          bracket_position: `KR${round - 1}M${i + 1}`,
          player1_id: null, // Will be filled from group stage results
          player2_id: null,
          status: 'pending'
        }

        matches.push(match)
      }

      currentRoundMatches = currentRoundMatches / 2
    }

    return matches
  }

  async saveMatches(matches) {
    const { data, error } = await supabase
      .from('matches')
      .insert(matches)
      .select()

    if (error) throw error
    return data
  }

  /**
   * Update tournament bracket after match result
   */
  async updateBracketProgression(matchId, winnerId) {
    // Get match details
    const { data: match, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (error) throw error

    // Update match result
    await supabase
      .from('matches')
      .update({
        winner_id: winnerId,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', matchId)

    // Progress winner to next round based on tournament type
    await this.progressToNextRound(match, winnerId)

    // Update tournament standings
    await this.updateTournamentStandings(match.tournament_id)
  }

  async progressToNextRound(match, winnerId) {
    if (match.next_match_id) {
      // Determine if winner goes to player1 or player2 slot
      const { data: nextMatch } = await supabase
        .from('matches')
        .select('player1_id, player2_id')
        .eq('id', match.next_match_id)
        .single()

      const updateField = !nextMatch.player1_id ? 'player1_id' : 'player2_id'

      await supabase
        .from('matches')
        .update({ [updateField]: winnerId })
        .eq('id', match.next_match_id)
    }

    // Handle losers bracket progression for double elimination
    if (match.match_type === 'winners_bracket' && match.losers_next_match_id) {
      const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id

      const { data: losersMatch } = await supabase
        .from('matches')
        .select('player1_id, player2_id')
        .eq('id', match.losers_next_match_id)
        .single()

      const updateField = !losersMatch.player1_id ? 'player1_id' : 'player2_id'

      await supabase
        .from('matches')
        .update({ [updateField]: loserId })
        .eq('id', match.losers_next_match_id)
    }
  }

  async updateTournamentStandings(tournamentId) {
    // This will be handled by the tournament_standings view
    // Additional logic can be added here for custom point calculations

    // Update group standings for group stage tournaments
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('tournament_type')
      .eq('id', tournamentId)
      .single()

    if (tournament.tournament_type === 'group_stage' || tournament.tournament_type === 'round_robin') {
      await this.updateGroupStandings(tournamentId)
    }
  }

  async updateGroupStandings(tournamentId) {
    // Update group participant statistics based on match results
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        *,
        tournament_groups(id, group_name)
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'completed')
      .not('group_id', 'is', null)

    // Group matches by group and calculate standings
    const groupStats = {}

    matches.forEach(match => {
      const groupId = match.group_id
      if (!groupStats[groupId]) {
        groupStats[groupId] = {}
      }

      // Calculate points (3 for win, 1 for draw, 0 for loss)
      if (match.winner_id) {
        const winnerId = match.winner_id
        const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id

        if (!groupStats[groupId][winnerId]) {
          groupStats[groupId][winnerId] = { points: 0, wins: 0, losses: 0, draws: 0 }
        }
        if (!groupStats[groupId][loserId]) {
          groupStats[groupId][loserId] = { points: 0, wins: 0, losses: 0, draws: 0 }
        }

        groupStats[groupId][winnerId].points += 3
        groupStats[groupId][winnerId].wins += 1
        groupStats[groupId][loserId].losses += 1
      }
    })

    // Update group_participants table
    for (const [groupId, stats] of Object.entries(groupStats)) {
      for (const [userId, userStats] of Object.entries(stats)) {
        await supabase
          .from('group_participants')
          .update(userStats)
          .eq('group_id', groupId)
          .eq('user_id', userId)
      }
    }
  }
}
