-- Create tournaments table with all necessary fields
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    game TEXT NOT NULL,
    tournament_type TEXT DEFAULT 'single_elimination',
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
    
    -- Organizer and contact info
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    host_contact_email TEXT,
    host_contact_chat TEXT,
    
    -- Participant limits and current count
    max_participants INTEGER DEFAULT 16,
    current_participants INTEGER DEFAULT 0,
    bracket_size INTEGER DEFAULT 16,
    
    -- Dates and scheduling
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Financial
    is_free BOOLEAN DEFAULT true,
    entry_fee_amount NUMERIC(10,2) DEFAULT 0,
    entry_fee_currency TEXT DEFAULT 'TZS',
    prize_pool TEXT,
    prize_structure JSONB,
    
    -- Rules and settings
    match_rules JSONB,
    match_schedule JSONB,
    participant_requirements JSONB,
    geographical_restrictions JSONB,
    result_submission_method TEXT DEFAULT 'manual',
    dispute_resolution_rules TEXT,
    
    -- Media and streaming
    image_url TEXT,
    streaming_enabled BOOLEAN DEFAULT false,
    streaming_link TEXT,
    platform_device TEXT,
    
    -- Additional info
    additional_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public tournaments are viewable by everyone" ON tournaments
    FOR SELECT USING (visibility = 'public' OR auth.uid() = organizer_id);

CREATE POLICY "Users can create tournaments" ON tournaments
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their tournaments" ON tournaments
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their tournaments" ON tournaments
    FOR DELETE USING (auth.uid() = organizer_id);

-- Create indexes
CREATE INDEX idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_game ON tournaments(game);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournaments_created_at ON tournaments(created_at);
