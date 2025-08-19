-- Create groups table for user communities
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    is_private BOOLEAN DEFAULT false,
    max_members INTEGER DEFAULT 100,
    current_members INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public groups are viewable by everyone" ON groups
    FOR SELECT USING (NOT is_private OR auth.uid() = owner_id);

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" ON groups
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups" ON groups
    FOR DELETE USING (auth.uid() = owner_id);

-- Create indexes
CREATE INDEX idx_groups_owner ON groups(owner_id);
CREATE INDEX idx_groups_name ON groups(name);
CREATE INDEX idx_groups_created_at ON groups(created_at);
