import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { TournamentBracketGenerator } from '@/lib/tournament/bracket-generator'

export async function POST(request, { params }) {
  try {
    // Use the service role key for server-side operations like other API routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,  // Use service role key
      {
        cookies: {
          get() { return undefined }, // Service role doesn't need cookies
        },
      }
    )

    const { id: matchId } = params
    const body = await request.json()

    // Get user from the request headers (set by middleware)
    const cookieStore = cookies()
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,  // Use anon key for auth
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      console.error('[AUTH] Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized - Please log in again' }, { status: 401 })
    }

    console.log('[AUTH] User authenticated successfully:', user.id)

    const { winner_id, player1_score = 0, player2_score = 0, screenshot_url, match_room_code, notes } = body

    // Get current user with detailed error logging
    console.log('[AUTH] Attempting to get user from Supabase...')
    const { data: dummy, error: authError2 } = await supabase.auth.getUser()

    if (authError2) {
      console.error('[AUTH] Supabase auth error:', authError2)
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

    // For match room code submissions, check if opponent has already submitted and enforce mutual requirement
    if (isMatchCodeOnly) {
      // Check if the opponent has already submitted a match room code
      const opponentId = match.player1_id === user.id ? match.player2_id : match.player1_id

      const { data: existingResults, error: resultsError } = await supabase
        .from('match_results')
        .select('submitted_by, result_notes')
        .eq('match_id', matchId)
        .contains('result_notes', 'Match Room Code:')

      if (resultsError) {
        console.error('[DATABASE] Error checking existing match results:', resultsError)
        return NextResponse.json({
          error: 'Failed to check existing submissions',
          details: resultsError.message
        }, { status: 500 })
      }

      // Check if current user has already submitted a room code
      const userAlreadySubmitted = existingResults?.some(result => result.submitted_by === user.id)
      if (userAlreadySubmitted) {
        return NextResponse.json({
          error: 'Room code already submitted',
          details: 'You have already submitted a match room code for this match'
        }, { status: 400 })
      }

      // Check if opponent has submitted a room code
      const opponentSubmitted = existingResults?.some(result => result.submitted_by === opponentId)

      if (opponentSubmitted) {
        // Both players have now provided room codes - this submission completes the requirement
        console.log('[MATCH_CODE] Both players have now provided room codes')
      } else {
        // This is the first room code submission - opponent will be required to provide one too
        console.log('[MATCH_CODE] First room code submitted, opponent must also provide one')
      }
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
    // Note: match_results table schema has: id, match_id, submitted_by, screenshot_url, score, result_notes, created_at, updated_at
    const insertData = {
      match_id: parseInt(matchId),
      submitted_by: user.id,
      result_notes: notes || ''
    }

    // Add result data only for full result reporting
    if (isFullResultReporting) {
      insertData.screenshot_url = screenshot_url || ''
      // Store score as the winner's score or combine scores
      insertData.score = winner_id === match.player1_id ? (player1_score || 0) : (player2_score || 0)

      // Add match room code to notes if provided
      if (match_room_code && match_room_code.trim() !== '') {
        insertData.result_notes = `${insertData.result_notes}\nMatch Room Code: ${match_room_code.trim()}`.trim()
      }
    } else {
      // For match code only submissions
      insertData.screenshot_url = '' // Not required for match code only
      insertData.score = null
      insertData.result_notes = `Match Room Code: ${match_room_code?.trim() || ''}`
    }

    const { data: matchResult, error: resultError } = await supabase
      .from('match_results')
      .insert(insertData)
      .select()
      .single()

    if (resultError) {
      console.error('[DATABASE] Failed to insert match result:', resultError)
      console.error('[DATABASE] Insert data was:', JSON.stringify(insertData, null, 2))
      return NextResponse.json({
        error: 'Failed to save match result',
        details: resultError.message,
        debug: {
          table: 'match_results',
          operation: 'insert',
          data: insertData
        }
      }, { status: 500 })
    }

    // Create notification for match code sharing
    if (isMatchCodeOnly && match_room_code && match_room_code.trim() !== '') {
      // Determine the opponent who should receive the notification
      const opponentId = match.player1_id === user.id ? match.player2_id : match.player1_id

      if (opponentId) {
        // Get player names for the notification
        const { data: currentPlayerProfile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single()

        const playerName = currentPlayerProfile?.full_name || currentPlayerProfile?.username || 'Player'

        // Re-check if opponent has submitted (use the same query as above)
        const { data: finalCheck } = await supabase
          .from('match_results')
          .select('submitted_by, result_notes')
          .eq('match_id', matchId)
          .contains('result_notes', 'Match Room Code:')

        const opponentSubmitted = finalCheck?.some(result => result.submitted_by === opponentId)

        if (opponentSubmitted) {
          // Both players have now provided room codes - notify both that match can begin
          const { data: opponentProfile } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', opponentId)
            .single()

          const opponentName = opponentProfile?.full_name || opponentProfile?.username || 'Player'

          // Notify the opponent that both codes are now available
          await supabase
            .from('notifications')
            .insert({
              user_id: opponentId,
              tournament_id: match.tournament_id,
              match_id: matchId,
              type: 'result_notification',
              title: 'Both Room Codes Received - Match Ready!',
              message: `Both you and ${playerName} have shared match room codes. The match can now begin!`,
              is_read: false,
              created_at: new Date().toISOString(),
              scheduled_for: new Date().toISOString()
            })

          // Notify the current user that both codes are submitted
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              tournament_id: match.tournament_id,
              match_id: matchId,
              type: 'result_notification',
              title: 'Both Room Codes Received - Match Ready!',
              message: `Both you and ${opponentName} have shared match room codes. The match can now begin!`,
              is_read: false,
              created_at: new Date().toISOString(),
              scheduled_for: new Date().toISOString()
            })
        } else {
          // First submission - notify opponent they need to provide their code too
          await supabase
            .from('notifications')
            .insert({
              user_id: opponentId,
              tournament_id: match.tournament_id,
              match_id: matchId,
              type: 'result_notification',
              title: 'Match Room Code Required',
              message: `${playerName} has shared their match room code. You must also provide your match room code before the match can begin.`,
              is_read: false,
              created_at: new Date().toISOString(),
              scheduled_for: new Date().toISOString()
            })
        }
      }
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

      // Create notifications for match result determination
      if (isFullResultReporting) {
        // Get player profiles for notifications
        const { data: player1Profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', match.player1_id)
          .single()

        const { data: player2Profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', match.player2_id)
          .single()

        const player1Name = player1Profile?.full_name || player1Profile?.username || 'Player 1'
        const player2Name = player2Profile?.full_name || player2Profile?.username || 'Player 2'

        // Determine winner and loser
        const winnerId = winner_id
        const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id
        const winnerName = winnerId === match.player1_id ? player1Name : player2Name
        const loserName = winnerId === match.player1_id ? player2Name : player1Name

        // Create notification for winner
        await supabase
          .from('notifications')
          .insert({
            user_id: winnerId,
            tournament_id: match.tournament_id,
            match_id: matchId,
            type: 'result_notification',
            title: 'Match Result: You Won!',
            message: `Congratulations! You have won your match against ${loserName}. You have advanced to the next round of the tournament.`,
            is_read: false,
            created_at: new Date().toISOString(),
            scheduled_for: new Date().toISOString()
          })

        // Create notification for loser
        await supabase
          .from('notifications')
          .insert({
            user_id: loserId,
            tournament_id: match.tournament_id,
            match_id: matchId,
            type: 'result_notification',
            title: 'Match Result: Match Completed',
            message: `Your match against ${winnerName} has been completed. Unfortunately, you have been eliminated from this tournament. Thank you for participating!`,
            is_read: false,
            created_at: new Date().toISOString(),
            scheduled_for: new Date().toISOString()
          })
      }

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
