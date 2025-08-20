-- Enhanced Tournament Schema for Multiple Tournament Formats
-- Run this after existing schema setup

-- Add new tournament types and enhance tournaments table
ALTER TABLE public.tournaments
DROP CONSTRAINT IF EXISTS tournaments_tournament_type_check;

ALTER TABLE public.tournaments
ADD CONSTRAINT tournaments_tournament_type_check
CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin', 'group_stage', 'custom'));

-- Add new columns for enhanced tournament management
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS bracket_type TEXT DEFAULT 'standard' CHECK (bracket_type IN ('standard', 'seeded', 'random'));

ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS group_count INTEGER DEFAULT 0;

ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS teams_per_group INTEGER DEFAULT 4;

ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS knockout_stage_teams INTEGER DEFAULT 0;

ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS custom_rules JSONB DEFAULT '{}';

ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS bracket_data JSONB DEFAULT '{}';

-- Create groups table for group stage tournaments
CREATE TABLE IF NOT EXISTS public.tournament_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL, -- 'A', 'B', 'C', etc.
  group_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, group_name),
  UNIQUE(tournament_id, group_index)
);

-- Create group participants table
CREATE TABLE IF NOT EXISTS public.group_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.tournament_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Enhance matches table for different tournament formats
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'knockout' CHECK (match_type IN ('group', 'knockout', 'winners_bracket', 'losers_bracket', 'grand_final'));

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.tournament_groups(id);

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS bracket_position TEXT; -- For positioning in bracket UI

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS is_bye BOOLEAN DEFAULT FALSE;

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS next_match_id UUID REFERENCES public.matches(id);

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS losers_next_match_id UUID REFERENCES public.matches(id);

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS player1_score INTEGER DEFAULT 0;

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS player2_score INTEGER DEFAULT 0;

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS match_data JSONB DEFAULT '{}'; -- Store additional match info

-- Create match results table for detailed tracking
CREATE TABLE IF NOT EXISTS public.match_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES public.profiles(id),
  result_data JSONB NOT NULL, -- Flexible result storage
  screenshot_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament standings view for easy querying
CREATE OR REPLACE VIEW public.tournament_standings AS
WITH participant_stats AS (
  SELECT
    tp.tournament_id,
    tp.user_id,
    p.username,
    p.full_name,
    COALESCE(wins.win_count, 0) as wins,
    COALESCE(losses.loss_count, 0) as losses,
    COALESCE(total.total_matches, 0) as total_matches,
    CASE
      WHEN COALESCE(total.total_matches, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(wins.win_count, 0)::decimal / total.total_matches) * 100, 1)
    END as win_percentage
  FROM public.tournament_participants tp
  JOIN public.profiles p ON tp.user_id = p.id
  LEFT JOIN (
    SELECT
      tournament_id,
      winner_id as user_id,
      COUNT(*) as win_count
    FROM public.matches
    WHERE status = 'completed' AND winner_id IS NOT NULL
    GROUP BY tournament_id, winner_id
  ) wins ON tp.tournament_id = wins.tournament_id AND tp.user_id = wins.user_id
  LEFT JOIN (
    SELECT
      tournament_id,
      CASE
        WHEN player1_id != winner_id THEN player1_id
        WHEN player2_id != winner_id THEN player2_id
      END as user_id,
      COUNT(*) as loss_count
    FROM public.matches
    WHERE status = 'completed' AND winner_id IS NOT NULL
    GROUP BY tournament_id,
      CASE
        WHEN player1_id != winner_id THEN player1_id
        WHEN player2_id != winner_id THEN player2_id
      END
  ) losses ON tp.tournament_id = losses.tournament_id AND tp.user_id = losses.user_id
  LEFT JOIN (
    SELECT
      tournament_id,
      player1_id as user_id,
      COUNT(*) as total_matches
    FROM public.matches
    WHERE status = 'completed'
    GROUP BY tournament_id, player1_id
    UNION ALL
    SELECT
      tournament_id,
      player2_id as user_id,
      COUNT(*) as total_matches
    FROM public.matches
    WHERE status = 'completed'
    GROUP BY tournament_id, player2_id
  ) total_agg ON tp.tournament_id = total_agg.tournament_id AND tp.user_id = total_agg.user_id
  LEFT JOIN (
    SELECT
      tournament_id,
      user_id,
      SUM(total_matches) as total_matches
    FROM (
      SELECT
        tournament_id,
        player1_id as user_id,
        COUNT(*) as total_matches
      FROM public.matches
      WHERE status = 'completed'
      GROUP BY tournament_id, player1_id
      UNION ALL
      SELECT
        tournament_id,
        player2_id as user_id,
        COUNT(*) as total_matches
      FROM public.matches
      WHERE status = 'completed'
      GROUP BY tournament_id, player2_id
    ) combined
    GROUP BY tournament_id, user_id
  ) total ON tp.tournament_id = total.tournament_id AND tp.user_id = total.user_id
)
SELECT
  tournament_id,
  user_id,
  username,
  full_name,
  wins,
  losses,
  total_matches,
  win_percentage,
  ROW_NUMBER() OVER (PARTITION BY tournament_id ORDER BY wins DESC, win_percentage DESC, losses ASC) as ranking
FROM participant_stats;

-- Add RLS policies for new tables
ALTER TABLE public.tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Tournament groups policies
CREATE POLICY "Tournament groups are viewable by everyone" ON public.tournament_groups
  FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage groups" ON public.tournament_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE tournaments.id = tournament_groups.tournament_id
      AND tournaments.created_by = auth.uid()
    )
  );

-- Group participants policies
CREATE POLICY "Group participants are viewable by everyone" ON public.group_participants
  FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage group participants" ON public.group_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tournament_groups tg
      JOIN public.tournaments t ON tg.tournament_id = t.id
      WHERE tg.id = group_participants.group_id
      AND t.created_by = auth.uid()
    )
  );

-- Match results policies
CREATE POLICY "Match results are viewable by everyone" ON public.match_results
  FOR SELECT USING (true);

CREATE POLICY "Match participants can report results" ON public.match_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_results.match_id
      AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
    )
  );

CREATE POLICY "Tournament creators can manage match results" ON public.match_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.tournaments t ON m.tournament_id = t.id
      WHERE m.id = match_results.match_id
      AND t.created_by = auth.uid()
    )
  );
