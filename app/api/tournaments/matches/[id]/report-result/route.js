import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { TournamentBracketGenerator } from '@/lib/tournament/bracket-generator'

export async function POST(request, { params }) {
  try {
    // Create server client with proper cookie handling for API routes
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { id: matchId } = params
    const body = await request.json()

    const { winner_id, player1_score = 0, player2_score = 0, screenshot_url, match_room_code, notes } = body

    // Get current user with detailed error logging
    console.log('[AUTH] Attempting to get user from Supabase...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[AUTH] Supabase auth error:', authError)
      return NextResponse.json({
        error: 'Authentication failed',
        details: authError.message || 'Unknown auth error'
      }, { status: 401 })
    }

    if (!user) {
      console.error('[AUTH] No user found in session')
      return NextResponse.json({
        error: 'User not authenticated',
        details: 'No valid user session found'
      }, { status: 401 })
    }

    console.log('[AUTH] User authenticated successfully:', user.id)

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        tournaments (
          id,
          organizer_id,
          tournament_type,
          status
        )
      `)
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Check if match is already completed
    if (match.status === 'completed') {
      return NextResponse.json({ error: 'Match already completed' }, { status: 400 })
    }

    // Validate permissions (participant or tournament organizer)
    const isParticipant = match.player1_id === user.id || match.player2_id === user.id
    const isOrganizer = match.tournaments.organizer_id === user.id

    console.log('[PERMISSIONS] Match player1_id:', match.player1_id)
    console.log('[PERMISSIONS] Match player2_id:', match.player2_id)
    console.log('[PERMISSIONS] Tournament organizer_id:', match.tournaments.organizer_id)
    console.log('[PERMISSIONS] Current user_id:', user.id)
    console.log('[PERMISSIONS] Is participant:', isParticipant)
    console.log('[PERMISSIONS] Is organizer:', isOrganizer)

    if (!isParticipant && !isOrganizer) {
      console.error('[PERMISSIONS] User lacks permission to report results')
      return NextResponse.json({
        error: 'Insufficient permissions',
        details: 'Only match participants or tournament organizer can report results',
        debug: {
          user_id: user.id,
          match_player1_id: match.player1_id,
          match_player2_id: match.player2_id,
          tournament_organizer_id: match.tournaments.organizer_id
        }
      }, { status: 403 })
    }

    // Determine if this is a match code only submission or full result reporting
    const isMatchCodeOnly = !winner_id && match_room_code && match_room_code.trim() !== ''
    const isFullResultReporting = winner_id && winner_id.trim() !== ''

    // Validate that at least one action is being performed
    if (!isMatchCodeOnly && !isFullResultReporting) {
      return NextResponse.json({
        error: 'Invalid submission',
        details: 'Must provide either match room code or full match results'
      }, { status: 400 })
    }

    // Validate winner_id only for full result reporting
    if (isFullResultReporting && winner_id !== match.player1_id && winner_id !== match.player2_id) {
      return NextResponse.json({ error: 'Invalid winner ID' }, { status: 400 })
    }

    // Validate screenshot requirement - only required when reporting full results
    if (isFullResultReporting && (!screenshot_url || screenshot_url.trim() === '')) {
      return NextResponse.json({
        error: 'Screenshot is required',
        details: 'A screenshot in PNG or JPEG format must be provided to report match results'
      }, { status: 400 })
    }

    // Validate screenshot format (basic validation for file extensions) - only when screenshot is provided
    if (screenshot_url && screenshot_url.trim() !== '') {
      const validImageFormats = /\.(png|jpe?g)$/i
      const isValidFormat = validImageFormats.test(screenshot_url) ||
                           screenshot_url.includes('.png') ||
                           screenshot_url.includes('.jpg') ||
                           screenshot_url.includes('.jpeg')

      if (!isValidFormat) {
        return NextResponse.json({
          error: 'Invalid screenshot format',
          details: 'Screenshot must be in PNG or JPEG format'
        }, { status: 400 })
      }
    }

    // Validate match room code requirement - only for match code submissions
    if (isMatchCodeOnly && (!match_room_code || match_room_code.trim() === '')) {
      return NextResponse.json({
        error: 'Match room code is required',
        details: 'A match room code must be provided'
      }, { status: 400 })
    }

    // Create match result record based on submission type
    const insertData = {
      match_id: matchId,
      submitted_by: user.id,
      notes: notes || '',
      status: isOrganizer ? 'approved' : 'pending'
    }

    // Add match room code if provided
    if (match_room_code && match_room_code.trim() !== '') {
      insertData.match_room_code = match_room_code.trim()
    }

    // Add result data only for full result reporting
    if (isFullResultReporting) {
      insertData.winner_id = winner_id
      insertData.player1_score = player1_score || 0
      insertData.player2_score = player2_score || 0
      insertData.screenshot_urls = screenshot_url ? [screenshot_url] : []
    } else {
      // For match code only, set result fields to null
      insertData.winner_id = null
      insertData.player1_score = null
      insertData.player2_score = null
      insertData.screenshot_urls = []
    }

    const { data: matchResult, error: resultError } = await supabase
      .from('match_results')
      .insert(insertData)
      .select()
      .single()

    if (resultError) {
      return NextResponse.json({ error: 'Failed to save match result' }, { status: 500 })
    }

    // If reported by organizer or auto-verification enabled, update match and progress tournament
    if (isOrganizer) {
      const bracketGenerator = new TournamentBracketGenerator()

      // Update match with result and scores
      await supabase
        .from('matches')
        .update({
          winner_id,
          player1_score,
          player2_score,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId)

      // Progress tournament bracket
      await bracketGenerator.updateBracketProgression(matchId, winner_id)

      return NextResponse.json({
        success: true,
        message: 'Match result reported and tournament progressed',
        data: {
          match_id: matchId,
          result_id: matchResult.id,
          winner_id,
          status: 'approved'
        }
      })
    } else {
      // For participant reports, require verification
      return NextResponse.json({
        success: true,
        message: 'Match result reported. Awaiting organizer verification.',
        data: {
          match_id: matchId,
          result_id: matchResult.id,
          winner_id,
          status: 'pending'
        }
      })
    }

  } catch (error) {
    console.error('Error reporting match result:', error)
    return NextResponse.json({
      error: 'Failed to report match result',
      details: error.message
    }, { status: 500 })
  }
}

// Verify match result (admin only)
export async function PATCH(request, { params }) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { id: matchId } = params
    const body = await request.json()

    const { result_id, verified, winner_id_override } = body

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get match and tournament details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        tournaments (
          organizer_id
        )
      `)
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Check if user is tournament organizer
    if (match.tournaments.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Only tournament organizer can verify results' }, { status: 403 })
    }

    // Get match result
    const { data: matchResult, error: resultError } = await supabase
      .from('match_results')
      .select('*')
      .eq('id', result_id)
      .single()

    if (resultError || !matchResult) {
      return NextResponse.json({ error: 'Match result not found' }, { status: 404 })
    }

    if (verified) {
      const bracketGenerator = new TournamentBracketGenerator()
      const finalWinnerId = winner_id_override || matchResult.winner_id

      // Update match result verification - FIXED to match database schema
      await supabase
        .from('match_results')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          winner_id: finalWinnerId
        })
        .eq('id', result_id)

      // Update match with verified result - FIXED to use direct columns
      await supabase
        .from('matches')
        .update({
          winner_id: finalWinnerId,
          player1_score: matchResult.player1_score || 0,
          player2_score: matchResult.player2_score || 0,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId)

      // Progress tournament bracket
      await bracketGenerator.updateBracketProgression(matchId, finalWinnerId)

      return NextResponse.json({
        success: true,
        message: 'Match result verified and tournament progressed',
        data: {
          match_id: matchId,
          result_id,
          winner_id: finalWinnerId,
          verified: true
        }
      })
    } else {
      // Reject result
      await supabase
        .from('match_results')
        .update({
          verified: false,
          verified_by: user.id
        })
        .eq('id', result_id)

      return NextResponse.json({
        success: true,
        message: 'Match result rejected',
        data: {
          match_id: matchId,
          result_id,
          verified: false
        }
      })
    }

  } catch (error) {
    console.error('Error verifying match result:', error)
    return NextResponse.json({
      error: 'Failed to verify match result',
      details: error.message
    }, { status: 500 })
  }
}
