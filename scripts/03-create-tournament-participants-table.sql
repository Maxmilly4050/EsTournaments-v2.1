-- Create tournament participants table
CREATE TABLE tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    seed INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tournament_id, user_id)
);

-- Enable RLS
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Tournament participants are viewable by everyone" ON tournament_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join tournaments" ON tournament_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave tournaments they joined" ON tournament_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX idx_tournament_participants_joined_at ON tournament_participants(joined_at);
