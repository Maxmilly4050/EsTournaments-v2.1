import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { TournamentBracketGenerator } from '@/lib/tournament/bracket-generator'

export async function POST(request, { params }) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { id: tournamentId } = params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Check if user is tournament organizer
    if (tournament.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Only tournament organizers can generate brackets' }, { status: 403 })
    }

    // Check if tournament already has generated brackets
    if (tournament.bracket_data?.generated) {
      return NextResponse.json({ error: 'Tournament bracket already generated' }, { status: 400 })
    }

    // Get tournament participants
    const { data: participants, error: participantsError } = await supabase
      .from('tournament_participants')
      .select(`
        user_id,
        joined_at,
        profiles (
          id,
          username,
          full_name
        )
      `)
      .eq('tournament_id', tournamentId)

    if (participantsError) {
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
    }

    if (participants.length < 2) {
      return NextResponse.json({ error: 'Tournament needs at least 2 participants to generate bracket' }, { status: 400 })
    }

    // Generate bracket
    const bracketGenerator = new TournamentBracketGenerator()
    const tournamentConfig = {
      tournament_type: tournament.tournament_type,
      bracket_type: tournament.bracket_type || 'standard',
      group_count: tournament.group_count || 4,
      teams_per_group: tournament.teams_per_group || 4,
      knockout_stage_teams: tournament.knockout_stage_teams || 2,
      custom_rules: tournament.custom_rules || {}
    }

    const matches = await bracketGenerator.generateTournament(
      tournamentId,
      participants,
      tournamentConfig
    )

    // Update tournament status and bracket data
    await supabase
      .from('tournaments')
      .update({
        status: 'ongoing',
        bracket_data: {
          ...tournament.bracket_data,
          generated: true,
          generated_at: new Date().toISOString(),
          total_matches: matches.length
        }
      })
      .eq('id', tournamentId)

    return NextResponse.json({
      success: true,
      message: 'Tournament bracket generated successfully',
      data: {
        tournament_id: tournamentId,
        total_matches: matches.length,
        tournament_type: tournament.tournament_type,
        participants_count: participants.length
      }
    })

  } catch (error) {
    console.error('Error generating tournament bracket:', error)
    return NextResponse.json({
      error: 'Failed to generate tournament bracket',
      details: error.message
    }, { status: 500 })
  }
}
