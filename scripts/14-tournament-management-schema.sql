-- Tournament Management System Schema Updates
-- Add new tables and columns for comprehensive tournament management

-- Add new columns to matches table for result management
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS player1_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS player2_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS player1_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS player2_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_decision TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS requires_admin_review BOOLEAN DEFAULT FALSE;

-- Create match_results table for detailed result tracking
CREATE TABLE IF NOT EXISTS match_results (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    screenshot_url TEXT,
    reported_winner_id UUID REFERENCES profiles(id),
    reported_score_player1 INTEGER,
    reported_score_player2 INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_rounds table for round management
CREATE TABLE IF NOT EXISTS tournament_rounds (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    round_name TEXT, -- "Round 1", "Quarterfinals", "Semifinals", "Finals"
    deadline TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- pending, active, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tournament_id, round_number)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- match_reminder, deadline_warning, result_notification, admin_decision
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_logs table for action tracking
CREATE TABLE IF NOT EXISTS tournament_logs (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    action_type TEXT NOT NULL, -- result_submitted, auto_advance, forfeit, admin_override, etc.
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_player_id ON match_results(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_tournament_id ON tournament_rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tournament_id ON notifications(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_logs_tournament_id ON tournament_logs(tournament_id);

-- Enable RLS on new tables
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_results
CREATE POLICY "Users can view their own match results" ON match_results
    FOR SELECT USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own match results" ON match_results
    FOR INSERT WITH CHECK (player_id = auth.uid());

CREATE POLICY "Tournament organizers can view all match results" ON match_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            JOIN matches m ON m.tournament_id = t.id
            WHERE m.id = match_results.match_id AND t.organizer_id = auth.uid()
        )
    );

-- RLS Policies for tournament_rounds
CREATE POLICY "Anyone can view tournament rounds" ON tournament_rounds
    FOR SELECT USING (true);

CREATE POLICY "Tournament organizers can manage rounds" ON tournament_rounds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_rounds.tournament_id AND t.organizer_id = auth.uid()
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- RLS Policies for tournament_logs
CREATE POLICY "Tournament participants can view logs" ON tournament_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tournament_participants tp
            WHERE tp.tournament_id = tournament_logs.tournament_id AND tp.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_logs.tournament_id AND t.organizer_id = auth.uid()
        )
    );

CREATE POLICY "System can insert logs" ON tournament_logs
    FOR INSERT WITH CHECK (true);

-- Function to automatically create tournament rounds when tournament starts
CREATE OR REPLACE FUNCTION create_tournament_rounds()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create rounds when tournament status changes to 'active'
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        -- Calculate number of rounds based on bracket size
        DECLARE
            num_rounds INTEGER;
            round_names TEXT[] := ARRAY['Round 1', 'Round 2', 'Quarterfinals', 'Semifinals', 'Finals'];
            i INTEGER;
        BEGIN
            -- Calculate rounds: log2(bracket_size)
            num_rounds := CEIL(LOG(2, NEW.bracket_size));
            
            -- Create rounds with appropriate names
            FOR i IN 1..num_rounds LOOP
                INSERT INTO tournament_rounds (tournament_id, round_number, round_name, status)
                VALUES (
                    NEW.id,
                    i,
                    CASE 
                        WHEN i <= array_length(round_names, 1) THEN round_names[i]
                        ELSE 'Round ' || i
                    END,
                    CASE WHEN i = 1 THEN 'active' ELSE 'pending' END
                );
            END LOOP;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic round creation
DROP TRIGGER IF EXISTS create_tournament_rounds_trigger ON tournaments;
CREATE TRIGGER create_tournament_rounds_trigger
    AFTER UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION create_tournament_rounds();
