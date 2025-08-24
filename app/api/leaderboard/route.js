import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { leaderboardService } from '@/lib/leaderboard-service'

// GET /api/leaderboard - Fetch leaderboard rankings with pagination
export async function GET(request) {
  try {
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100) // Max 100 per page
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)
    const useCache = url.searchParams.get('cache') !== 'false'

    // If using cache, try to get from database first
    if (useCache) {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value
            },
          },
        }
      )

      try {
        // Get cached leaderboard from database
        const { data: cachedRankings, error: cacheError } = await supabase
          .from('leaderboard_with_users')
          .select(`
            rank,
            user_id,
            username,
            full_name,
            avatar_url,
            wins,
            losses,
            total_matches,
            win_rate,
            leaderboard_score,
            match_weight_factor,
            head_to_head_wins,
            head_to_head_total,
            head_to_head_win_rate,
            average_opponent_strength,
            current_streak,
            streak_type,
            recent_win_rate_30d,
            last_match_date,
            last_updated
          `)
          .range(offset, offset + limit - 1)

        if (!cacheError && cachedRankings && cachedRankings.length > 0) {
          // Get total count of qualified players
          const { count: totalQualified } = await supabase
            .from('leaderboard_rankings')
            .select('id', { count: 'exact' })
            .eq('is_qualified', true)

          return NextResponse.json({
            success: true,
            data: {
              leaderboard: cachedRankings.map(player => ({
                rank: player.rank,
                userId: player.user_id,
                username: player.username,
                fullName: player.full_name,
                avatarUrl: player.avatar_url,
                wins: player.wins,
                losses: player.losses,
                totalMatches: player.total_matches,
                winRate: parseFloat(player.win_rate),
                leaderboardScore: parseFloat(player.leaderboard_score),
                matchWeightFactor: parseFloat(player.match_weight_factor),
                headToHeadWins: player.head_to_head_wins,
                headToHeadTotal: player.head_to_head_total,
                headToHeadWinRate: parseFloat(player.head_to_head_win_rate || 0),
                averageOpponentStrength: parseFloat(player.average_opponent_strength || 0),
                currentStreak: player.current_streak,
                streakType: player.streak_type,
                recentWinRate30d: parseFloat(player.recent_win_rate_30d || 0),
                lastMatchDate: player.last_match_date,
                lastUpdated: player.last_updated
              })),
              totalPlayers: totalQualified || 0,
              totalQualifiedPlayers: totalQualified || 0,
              minimumMatches: 10,
              fromCache: true,
              limit,
              offset
            }
          })
        }
      } catch (error) {
        console.log('Cache lookup failed, falling back to live calculation:', error.message)
      }
    }

    // Fall back to live calculation
    const result = await leaderboardService.calculateLeaderboard(limit, offset)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        fromCache: false,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Error in leaderboard API:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch leaderboard',
      details: error.message
    }, { status: 500 })
  }
}

// POST /api/leaderboard - Force refresh leaderboard calculations
export async function POST(request) {
  try {
    // Create authenticated Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check if user is authenticated (optional - you might want admin-only access)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { triggerReason = 'manual', triggerDetails = {} } = body

    console.log('Starting leaderboard recalculation...')
    const startTime = Date.now()

    // Calculate new leaderboard
    const result = await leaderboardService.calculateLeaderboard(1000) // Get all qualified players

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

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

    } catch (cacheError) {
      console.error('Error updating leaderboard cache:', cacheError)
      // Don't fail the request if caching fails
    }

    console.log(`Leaderboard recalculation completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        updateDuration: duration,
        fromCache: false
      },
      message: `Leaderboard recalculated successfully in ${duration}ms`
    })

  } catch (error) {
    console.error('Error in leaderboard refresh API:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh leaderboard',
      details: error.message
    }, { status: 500 })
  }
}
