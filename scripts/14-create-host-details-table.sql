-- Create host_details table to capture tournament organizer information
CREATE TABLE IF NOT EXISTS host_details (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  contact_chat TEXT,
  contact_phone TEXT,
  organization_name TEXT,
  experience_level TEXT,
  preferred_contact_method TEXT DEFAULT 'email',
  availability_hours JSONB,
  social_links JSONB,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id) -- One host detail record per tournament
);

-- Enable RLS
ALTER TABLE host_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for host_details
CREATE POLICY "Host details are viewable by everyone" ON host_details FOR SELECT USING (true);
CREATE POLICY "Users can insert their own host details" ON host_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own host details" ON host_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own host details" ON host_details FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_host_details_user_id ON host_details(user_id);
CREATE INDEX IF NOT EXISTS idx_host_details_tournament_id ON host_details(tournament_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_host_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_host_details_updated_at
  BEFORE UPDATE ON host_details
  FOR EACH ROW
  EXECUTE FUNCTION update_host_details_updated_at();
