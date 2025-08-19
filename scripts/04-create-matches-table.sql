-- Create matches table for tournament brackets
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    round INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    
    -- Players
    player1_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Scores
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    
    -- Status and timing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ongoing', 'completed', 'disputed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tournament_id, round, match_number)
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Matches are viewable by everyone" ON matches
    FOR SELECT USING (true);

CREATE POLICY "Tournament organizers can manage matches" ON matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tournaments 
            WHERE tournaments.id = matches.tournament_id 
            AND tournaments.organizer_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_round ON matches(tournament_id, round);
CREATE INDEX idx_matches_players ON matches(player1_id, player2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled_at ON matches(scheduled_at);
