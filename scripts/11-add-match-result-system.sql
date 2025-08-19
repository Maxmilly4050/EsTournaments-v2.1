-- Add match result submission system with screenshot uploads and dispute resolution

-- Create match_results table for result submissions
CREATE TABLE IF NOT EXISTS public.match_results (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES public.matches(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES auth.users(id),
  winner_id UUID REFERENCES auth.users(id),
  player1_score INTEGER NOT NULL,
  player2_score INTEGER NOT NULL,
  screenshot_urls TEXT[], -- Array of screenshot URLs
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disputed', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create match_disputes table for handling conflicts
CREATE TABLE IF NOT EXISTS public.match_disputes (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES public.matches(id) ON DELETE CASCADE,
  match_result_id INTEGER REFERENCES public.match_results(id) ON DELETE CASCADE,
  disputed_by UUID REFERENCES auth.users(id),
  dispute_reason TEXT NOT NULL,
  dispute_evidence TEXT[], -- Array of evidence URLs
  admin_notes TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create tournament_admins table for admin permissions
CREATE TABLE IF NOT EXISTS public.tournament_admins (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_admins ENABLE ROW LEVEL SECURITY;

-- RLS policies for match_results
CREATE POLICY "Match results are viewable by tournament participants and organizers" ON public.match_results FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.tournaments t ON m.tournament_id = t.id
    WHERE m.id = match_results.match_id 
    AND (
      t.organizer_id = auth.uid() OR
      m.player1_id = auth.uid() OR 
      m.player2_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.tournament_admins ta 
        WHERE ta.tournament_id = t.id AND ta.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Match participants can submit results" ON public.match_results FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_results.match_id 
    AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
  )
);

CREATE POLICY "Tournament organizers and admins can update match results" ON public.match_results FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.tournaments t ON m.tournament_id = t.id
    WHERE m.id = match_results.match_id 
    AND (
      t.organizer_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.tournament_admins ta 
        WHERE ta.tournament_id = t.id AND ta.user_id = auth.uid()
      )
    )
  )
);

-- RLS policies for match_disputes
CREATE POLICY "Disputes are viewable by involved parties and admins" ON public.match_disputes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.tournaments t ON m.tournament_id = t.id
    WHERE m.id = match_disputes.match_id 
    AND (
      t.organizer_id = auth.uid() OR
      m.player1_id = auth.uid() OR 
      m.player2_id = auth.uid() OR
      match_disputes.disputed_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.tournament_admins ta 
        WHERE ta.tournament_id = t.id AND ta.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Match participants can create disputes" ON public.match_disputes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_disputes.match_id 
    AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
  )
);

CREATE POLICY "Tournament organizers and admins can manage disputes" ON public.match_disputes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.tournaments t ON m.tournament_id = t.id
    WHERE m.id = match_disputes.match_id 
    AND (
      t.organizer_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.tournament_admins ta 
        WHERE ta.tournament_id = t.id AND ta.user_id = auth.uid()
      )
    )
  )
);

-- RLS policies for tournament_admins
CREATE POLICY "Tournament admins are viewable by tournament organizers and admins" ON public.tournament_admins FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = tournament_admins.tournament_id 
    AND (
      t.organizer_id = auth.uid() OR
      tournament_admins.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Tournament organizers can manage admins" ON public.tournament_admins FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = tournament_admins.tournament_id 
    AND t.organizer_id = auth.uid()
  )
);

-- Function to automatically approve match results when both players submit the same result
CREATE OR REPLACE FUNCTION public.auto_approve_matching_results()
RETURNS TRIGGER AS $$
DECLARE
  other_result RECORD;
  match_record RECORD;
BEGIN
  -- Get the match details
  SELECT * INTO match_record FROM public.matches WHERE id = NEW.match_id;
  
  -- Check if there's another result submission for this match
  SELECT * INTO other_result 
  FROM public.match_results 
  WHERE match_id = NEW.match_id 
    AND submitted_by != NEW.submitted_by 
    AND status = 'pending'
  ORDER BY submitted_at DESC 
  LIMIT 1;
  
  -- If both players submitted the same result, auto-approve
  IF other_result.id IS NOT NULL 
     AND other_result.winner_id = NEW.winner_id 
     AND other_result.player1_score = NEW.player1_score 
     AND other_result.player2_score = NEW.player2_score THEN
    
    -- Update both results to approved
    UPDATE public.match_results 
    SET status = 'approved', reviewed_at = NOW()
    WHERE id IN (NEW.id, other_result.id);
    
    -- Update the match with the result
    UPDATE public.matches 
    SET 
      winner_id = NEW.winner_id,
      player1_score = NEW.player1_score,
      player2_score = NEW.player2_score,
      status = 'completed',
      completed_at = NOW()
    WHERE id = NEW.match_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-approval
DROP TRIGGER IF EXISTS auto_approve_results_trigger ON public.match_results;
CREATE TRIGGER auto_approve_results_trigger
  AFTER INSERT ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_matching_results();

-- Insert sample match results and disputes for demonstration
INSERT INTO public.match_results (match_id, submitted_by, winner_id, player1_score, player2_score, screenshot_urls, notes, status) VALUES
(1, (SELECT player1_id FROM public.matches WHERE id = 1), (SELECT player1_id FROM public.matches WHERE id = 1), 2, 1, ARRAY['/screenshots/match1_result.png'], 'Clean victory, good game!', 'approved'),
(2, (SELECT player1_id FROM public.matches WHERE id = 2), (SELECT player2_id FROM public.matches WHERE id = 2), 0, 2, ARRAY['/screenshots/match2_result1.png', '/screenshots/match2_result2.png'], 'Opponent played really well', 'pending');

SELECT 'Match result submission system created successfully!' as status;
