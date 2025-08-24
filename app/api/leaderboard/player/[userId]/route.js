import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { leaderboardService } from '@/lib/leaderboard-service'

// GET /api/leaderboard/player/[userId] - Get individual player's leaderboard ranking
export async function GET(request, { params }) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const url = new URL(request.url)
    const useCache = url.searchParams.get('cache') !== 'false'

    // Try to get from cache first if enabled
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
        // Try to get player ranking from database cache
        const { data: cachedRanking, error: cacheError } = await supabase
          .rpc('get_player_leaderboard_position', { player_id: userId })

        if (!cacheError && cachedRanking && cachedRanking.length > 0) {
          const ranking = cachedRanking[0]

          // Get additional player details
          const { data: playerDetails, error: playerError } = await supabase
            .from('leaderboard_with_users')
            .select(`
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
            .eq('user_id', userId)
            .single()

          if (!playerError && playerDetails) {
            return NextResponse.json({
              success: true,
              data: {
                rank: ranking.rank,
                totalQualifiedPlayers: ranking.total_qualified_players,
                qualified: ranking.is_qualified,
                userId: playerDetails.user_id,
                username: playerDetails.username,
                fullName: playerDetails.full_name,
                avatarUrl: playerDetails.avatar_url,
                wins: playerDetails.wins,
                losses: playerDetails.losses,
                totalMatches: playerDetails.total_matches,
                winRate: parseFloat(playerDetails.win_rate),
                leaderboardScore: parseFloat(playerDetails.leaderboard_score),
                matchWeightFactor: parseFloat(playerDetails.match_weight_factor || 0),
                headToHeadWins: playerDetails.head_to_head_wins,
                headToHeadTotal: playerDetails.head_to_head_total,
                headToHeadWinRate: parseFloat(playerDetails.head_to_head_win_rate || 0),
                averageOpponentStrength: parseFloat(playerDetails.average_opponent_strength || 0),
                currentStreak: playerDetails.current_streak,
                streakType: playerDetails.streak_type,
                recentWinRate30d: parseFloat(playerDetails.recent_win_rate_30d || 0),
                lastMatchDate: playerDetails.last_match_date,
                lastUpdated: playerDetails.last_updated,
                fromCache: true
              }
            })
          }
        }
      } catch (error) {
        console.log('Player cache lookup failed, falling back to live calculation:', error.message)
      }
    }

    // Fall back to live calculation
    const result = await leaderboardService.getPlayerRanking(userId)

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
        fromCache: false
      }
    })

  } catch (error) {
    console.error('Error in player ranking API:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch player ranking',
      details: error.message
    }, { status: 500 })
  }
}
