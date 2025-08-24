-- Create leaderboard tables and functions for efficient ranking system
-- This script implements the EsTournaments leaderboard ranking system

-- Table to store leaderboard rankings with caching for performance
CREATE TABLE IF NOT EXISTS public.leaderboard_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  rank INTEGER NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  total_matches INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  leaderboard_score DECIMAL(10,4) NOT NULL DEFAULT 0,
  match_weight_factor DECIMAL(6,2) NOT NULL DEFAULT 0,
  head_to_head_wins INTEGER DEFAULT 0,
  head_to_head_total INTEGER DEFAULT 0,
  head_to_head_win_rate DECIMAL(5,2) DEFAULT 0,
  average_opponent_strength DECIMAL(10,4) DEFAULT 0,
  is_qualified BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track leaderboard update history
CREATE TABLE IF NOT EXISTS public.leaderboard_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_players INTEGER NOT NULL,
  qualified_players INTEGER NOT NULL,
  update_duration_ms INTEGER,
  triggered_by TEXT, -- 'manual', 'match_completion', 'scheduled'
  trigger_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store player match statistics for quick lookup
CREATE TABLE IF NOT EXISTS public.player_match_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_matches INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  recent_matches_30d INTEGER NOT NULL DEFAULT 0,
  recent_wins_30d INTEGER NOT NULL DEFAULT 0,
  recent_win_rate_30d DECIMAL(5,2) NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  streak_type TEXT DEFAULT 'none' CHECK (streak_type IN ('win', 'loss', 'none')),
  last_match_date TIMESTAMP WITH TIME ZONE,
  first_match_date TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_rank ON public.leaderboard_rankings(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_score ON public.leaderboard_rankings(leaderboard_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_qualified ON public.leaderboard_rankings(is_qualified, leaderboard_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_user ON public.leaderboard_rankings(user_id);

CREATE INDEX IF NOT EXISTS idx_player_match_stats_user ON public.player_match_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_matches ON public.player_match_stats(total_matches DESC);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_win_rate ON public.player_match_stats(win_rate DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_updates_created ON public.leaderboard_updates(created_at DESC);

-- Function to calculate player match statistics
CREATE OR REPLACE FUNCTION calculate_player_match_stats(player_id UUID)
RETURNS TABLE(
  total_matches BIGINT,
  wins BIGINT,
  losses BIGINT,
  win_rate DECIMAL,
  recent_matches_30d BIGINT,
  recent_wins_30d BIGINT,
  recent_win_rate_30d DECIMAL,
  first_match TIMESTAMP WITH TIME ZONE,
  last_match TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH player_matches AS (
    SELECT
      m.*,
      t.status as tournament_status,
      CASE
        WHEN m.winner_id = player_id THEN 1
        ELSE 0
      END as is_win,
      CASE
        WHEN m.completed_at >= NOW() - INTERVAL '30 days' THEN 1
        ELSE 0
      END as is_recent
    FROM matches m
    INNER JOIN tournaments t ON m.tournament_id = t.id
    WHERE (m.player1_id = player_id OR m.player2_id = player_id)
      AND m.status = 'completed'
      AND m.winner_id IS NOT NULL
      AND t.status = 'completed'
  ),
  stats AS (
    SELECT
      COUNT(*) as total_matches,
      SUM(is_win) as wins,
      COUNT(*) - SUM(is_win) as losses,
      CASE
        WHEN COUNT(*) > 0 THEN ROUND((SUM(is_win)::DECIMAL / COUNT(*)) * 100, 2)
        ELSE 0
      END as win_rate,
      SUM(is_recent) as recent_matches_30d,
      SUM(is_win * is_recent) as recent_wins_30d,
      CASE
        WHEN SUM(is_recent) > 0 THEN ROUND((SUM(is_win * is_recent)::DECIMAL / SUM(is_recent)) * 100, 2)
        ELSE 0
      END as recent_win_rate_30d,
      MIN(completed_at) as first_match,
      MAX(completed_at) as last_match
    FROM player_matches
  )
  SELECT * FROM stats;
END;
$$ LANGUAGE plpgsql;

-- Function to update player match stats
CREATE OR REPLACE FUNCTION update_player_match_stats(player_id UUID)
RETURNS VOID AS $$
DECLARE
  stats_record RECORD;
BEGIN
  -- Get calculated stats
  SELECT * INTO stats_record
  FROM calculate_player_match_stats(player_id);

  -- Upsert into player_match_stats
  INSERT INTO public.player_match_stats (
    user_id,
    total_matches,
    wins,
    losses,
    win_rate,
    recent_matches_30d,
    recent_wins_30d,
    recent_win_rate_30d,
    first_match_date,
    last_match_date,
    last_updated
  ) VALUES (
    player_id,
    COALESCE(stats_record.total_matches, 0),
    COALESCE(stats_record.wins, 0),
    COALESCE(stats_record.losses, 0),
    COALESCE(stats_record.win_rate, 0),
    COALESCE(stats_record.recent_matches_30d, 0),
    COALESCE(stats_record.recent_wins_30d, 0),
    COALESCE(stats_record.recent_win_rate_30d, 0),
    stats_record.first_match,
    stats_record.last_match,
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_matches = EXCLUDED.total_matches,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    win_rate = EXCLUDED.win_rate,
    recent_matches_30d = EXCLUDED.recent_matches_30d,
    recent_wins_30d = EXCLUDED.recent_wins_30d,
    recent_win_rate_30d = EXCLUDED.recent_win_rate_30d,
    first_match_date = EXCLUDED.first_match_date,
    last_match_date = EXCLUDED.last_match_date,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to trigger leaderboard recalculation when a match is completed
CREATE OR REPLACE FUNCTION trigger_leaderboard_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats for both players involved in the match
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL THEN
    PERFORM update_player_match_stats(NEW.player1_id);
    PERFORM update_player_match_stats(NEW.player2_id);

    -- You can add additional logic here to trigger a full leaderboard recalculation
    -- This could be done via a background job or immediate calculation depending on needs
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update player stats when matches are completed
DROP TRIGGER IF EXISTS update_leaderboard_on_match_completion ON public.matches;
CREATE TRIGGER update_leaderboard_on_match_completion
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.winner_id IS DISTINCT FROM NEW.winner_id)
  EXECUTE FUNCTION trigger_leaderboard_update();

-- View for easy leaderboard querying with user details
CREATE OR REPLACE VIEW public.leaderboard_with_users AS
SELECT
  lr.*,
  p.username,
  p.full_name,
  p.avatar_url,
  pms.current_streak,
  pms.streak_type,
  pms.recent_win_rate_30d,
  pms.last_match_date
FROM public.leaderboard_rankings lr
INNER JOIN public.profiles p ON lr.user_id = p.id
LEFT JOIN public.player_match_stats pms ON lr.user_id = pms.user_id
WHERE lr.is_qualified = true
ORDER BY lr.rank ASC;

-- View for getting top qualified players
CREATE OR REPLACE VIEW public.top_leaderboard AS
SELECT *
FROM public.leaderboard_with_users
WHERE rank <= 100
ORDER BY rank ASC;

-- Enable Row Level Security for new tables
ALTER TABLE public.leaderboard_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for leaderboard tables
CREATE POLICY "Leaderboard rankings are viewable by everyone" ON public.leaderboard_rankings
  FOR SELECT USING (true);

CREATE POLICY "Player match stats are viewable by everyone" ON public.player_match_stats
  FOR SELECT USING (true);

CREATE POLICY "Leaderboard updates are viewable by everyone" ON public.leaderboard_updates
  FOR SELECT USING (true);

-- Grant access to authenticated users for leaderboard functions
GRANT EXECUTE ON FUNCTION calculate_player_match_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_match_stats(UUID) TO authenticated;

-- Create helper function to get player's leaderboard position
CREATE OR REPLACE FUNCTION get_player_leaderboard_position(player_id UUID)
RETURNS TABLE(
  rank INTEGER,
  total_qualified_players INTEGER,
  is_qualified BOOLEAN,
  leaderboard_score DECIMAL,
  win_rate DECIMAL,
  total_matches INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lr.rank,
    (SELECT COUNT(*)::INTEGER FROM public.leaderboard_rankings WHERE is_qualified = true) as total_qualified_players,
    lr.is_qualified,
    lr.leaderboard_score,
    lr.win_rate,
    lr.total_matches
  FROM public.leaderboard_rankings lr
  WHERE lr.user_id = player_id;

  -- If no record found, return default values
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      0 as rank,
      (SELECT COUNT(*)::INTEGER FROM public.leaderboard_rankings WHERE is_qualified = true) as total_qualified_players,
      false as is_qualified,
      0.0::DECIMAL as leaderboard_score,
      0.0::DECIMAL as win_rate,
      0 as total_matches;
  END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_player_leaderboard_position(UUID) TO authenticated;
