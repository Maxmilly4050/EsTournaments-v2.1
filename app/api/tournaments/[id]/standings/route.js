import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request, { params }) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { id: tournamentId } = params
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    let standings = []

    // Handle different tournament types
    switch (tournament.tournament_type) {
      case 'round_robin':
        standings = await getRoundRobinStandings(supabase, tournamentId)
        break

      case 'group_stage':
        if (groupId) {
          standings = await getGroupStandings(supabase, tournamentId, groupId)
        } else {
          standings = await getAllGroupStandings(supabase, tournamentId)
        }
        break

      case 'single_elimination':
      case 'double_elimination':
        standings = await getEliminationStandings(supabase, tournamentId)
        break

      case 'custom':
        // Handle custom format based on tournament configuration
        if (tournament.custom_rules?.groupPhase) {
          standings = await getAllGroupStandings(supabase, tournamentId)
        } else {
          standings = await getEliminationStandings(supabase, tournamentId)
        }
        break

      default:
        standings = await getGeneralStandings(supabase, tournamentId)
    }

    return NextResponse.json({
      success: true,
      data: {
        tournament_id: tournamentId,
        tournament_type: tournament.tournament_type,
        standings,
        last_updated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching tournament standings:', error)
    return NextResponse.json({
      error: 'Failed to fetch tournament standings',
      details: error.message
    }, { status: 500 })
  }
}

async function getRoundRobinStandings(supabase, tournamentId) {
  const { data: standings, error } = await supabase
    .from('tournament_standings')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('ranking', { ascending: true })

  if (error) throw error

  return standings.map(participant => ({
    user_id: participant.user_id,
    username: participant.username,
    full_name: participant.full_name,
    position: participant.ranking,
    wins: participant.wins,
    losses: participant.losses,
    total_matches: participant.total_matches,
    win_percentage: participant.win_percentage,
    points: participant.wins * 3 // 3 points per win in round robin
  }))
}

async function getGroupStandings(supabase, tournamentId, groupId) {
  const { data: groupParticipants, error } = await supabase
    .from('group_participants')
    .select(`
      *,
      profiles (
        username,
        full_name
      ),
      tournament_groups (
        group_name
      )
    `)
    .eq('group_id', groupId)
    .order('points', { ascending: false })
    .order('goal_difference', { ascending: false })
    .order('goals_for', { ascending: false })

  if (error) throw error

  return groupParticipants.map((participant, index) => ({
    user_id: participant.user_id,
    username: participant.profiles.username,
    full_name: participant.profiles.full_name,
    group_name: participant.tournament_groups.group_name,
    position: index + 1,
    points: participant.points,
    wins: participant.wins,
    losses: participant.losses,
    draws: participant.draws,
    goals_for: participant.goals_for,
    goals_against: participant.goals_against,
    goal_difference: participant.goal_difference,
    matches_played: participant.wins + participant.losses + participant.draws
  }))
}

async function getAllGroupStandings(supabase, tournamentId) {
  // Get all groups for this tournament
  const { data: groups, error: groupsError } = await supabase
    .from('tournament_groups')
    .select('id, group_name')
    .eq('tournament_id', tournamentId)
    .order('group_index')

  if (groupsError) throw groupsError

  const allStandings = []

  for (const group of groups) {
    const groupStandings = await getGroupStandings(supabase, tournamentId, group.id)
    allStandings.push({
      group_id: group.id,
      group_name: group.group_name,
      standings: groupStandings
    })
  }

  return allStandings
}

async function getEliminationStandings(supabase, tournamentId) {
  // For elimination tournaments, show current bracket status
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey (
        id,
        username,
        full_name
      ),
      player2:profiles!matches_player2_id_fkey (
        id,
        username,
        full_name
      ),
      winner:profiles!matches_winner_id_fkey (
        id,
        username,
        full_name
      )
    `)
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: false })
    .order('match_number')

  if (matchesError) throw matchesError

  // Get all participants
  const { data: participants, error: participantsError } = await supabase
    .from('tournament_participants')
    .select(`
      user_id,
      profiles (
        id,
        username,
        full_name
      )
    `)
    .eq('tournament_id', tournamentId)

  if (participantsError) throw participantsError

  // Calculate elimination standings
  const participantStatus = {}

  participants.forEach(p => {
    participantStatus[p.user_id] = {
      user_id: p.user_id,
      username: p.profiles.username,
      full_name: p.profiles.full_name,
      status: 'active',
      eliminated_in_round: null,
      current_round: 1,
      wins: 0,
      losses: 0
    }
  })

  matches.forEach(match => {
    if (match.status === 'completed' && match.winner_id) {
      // Update winner stats
      if (participantStatus[match.winner_id]) {
        participantStatus[match.winner_id].wins++
        participantStatus[match.winner_id].current_round = Math.max(
          participantStatus[match.winner_id].current_round,
          match.round + 1
        )
      }

      // Update loser stats
      const loserId = match.player1_id === match.winner_id ? match.player2_id : match.player1_id
      if (participantStatus[loserId]) {
        participantStatus[loserId].losses++
        if (match.match_type !== 'losers_bracket') {
          participantStatus[loserId].status = 'eliminated'
          participantStatus[loserId].eliminated_in_round = match.round
        }
      }
    }
  })

  // Sort by performance (current round, then wins, then losses)
  const standings = Object.values(participantStatus).sort((a, b) => {
    if (a.current_round !== b.current_round) {
      return b.current_round - a.current_round
    }
    if (a.wins !== b.wins) {
      return b.wins - a.wins
    }
    return a.losses - b.losses
  })

  return standings.map((participant, index) => ({
    ...participant,
    position: index + 1
  }))
}

async function getGeneralStandings(supabase, tournamentId) {
  // Fallback general standings
  const { data: standings, error } = await supabase
    .from('tournament_standings')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('ranking', { ascending: true })

  if (error) throw error

  return standings
}
