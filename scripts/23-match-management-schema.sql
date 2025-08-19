-- Match Management System Database Schema
-- Adds match codes and creates match_results table for screenshot submissions

-- Add match_code field to existing matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_code TEXT,
ADD COLUMN IF NOT EXISTS code_set_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS code_set_at TIMESTAMP WITH TIME ZONE;

-- Create match_results table for screenshot submissions
CREATE TABLE IF NOT EXISTS match_results (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL,
    score INTEGER,
    result_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for match result screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('match-results', 'match-results', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for match_results table
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Players can insert their own results
CREATE POLICY "Players can submit their own match results" ON match_results
    FOR INSERT WITH CHECK (
        auth.uid() = submitted_by AND
        EXISTS (
            SELECT 1 FROM matches 
            WHERE id = match_id 
            AND (player1_id = auth.uid() OR player2_id = auth.uid())
        )
    );

-- Players can view results for matches they're in
CREATE POLICY "Players can view results for their matches" ON match_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches 
            WHERE id = match_id 
            AND (player1_id = auth.uid() OR player2_id = auth.uid())
        )
    );

-- Tournament organizers can view all results for their tournaments
CREATE POLICY "Organizers can view all results for their tournaments" ON match_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches m
            JOIN tournaments t ON m.tournament_id = t.id
            WHERE m.id = match_id AND t.organizer_id = auth.uid()
        )
    );

-- Set up storage policies for match result screenshots
CREATE POLICY "Players can upload match result screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'match-results' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Players can view match result screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'match-results' AND
        auth.role() = 'authenticated'
    );

-- Update matches table RLS policies to allow match code setting
CREATE POLICY "Players can set match codes for their matches" ON matches
    FOR UPDATE USING (
        (player1_id = auth.uid() OR player2_id = auth.uid()) AND
        (match_code IS NULL OR code_set_by IS NULL)
    ) WITH CHECK (
        (player1_id = auth.uid() OR player2_id = auth.uid())
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_submitted_by ON match_results(submitted_by);
CREATE INDEX IF NOT EXISTS idx_matches_match_code ON matches(match_code) WHERE match_code IS NOT NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_match_results_updated_at 
    BEFORE UPDATE ON match_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE match_results IS 'Stores screenshot submissions and results from players for tournament matches';
COMMENT ON COLUMN matches.match_code IS 'Player-generated code for the match (e.g., ABC123)';
COMMENT ON COLUMN matches.code_set_by IS 'ID of the player who set the match code';
COMMENT ON COLUMN matches.code_set_at IS 'Timestamp when the match code was set';
