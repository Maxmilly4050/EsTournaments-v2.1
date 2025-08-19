-- Create friends table for user relationships
CREATE TABLE friends (
    id SERIAL PRIMARY KEY,
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own friend relationships" ON friends
    FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create friend requests" ON friends
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update friend requests they're involved in" ON friends
    FOR UPDATE USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can delete their friend relationships" ON friends
    FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Create indexes
CREATE INDEX idx_friends_follower ON friends(follower_id);
CREATE INDEX idx_friends_following ON friends(following_id);
CREATE INDEX idx_friends_status ON friends(status);
