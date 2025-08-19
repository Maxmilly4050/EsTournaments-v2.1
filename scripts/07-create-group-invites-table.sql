-- Create group invites table
CREATE TABLE group_invites (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(group_id, invitee_id)
);

-- Enable RLS
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own invites" ON group_invites
    FOR SELECT USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Group members can create invites" ON group_invites
    FOR INSERT WITH CHECK (
        auth.uid() = inviter_id AND
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_id = group_invites.group_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Invitees can update invite status" ON group_invites
    FOR UPDATE USING (auth.uid() = invitee_id);

-- Create indexes
CREATE INDEX idx_group_invites_group ON group_invites(group_id);
CREATE INDEX idx_group_invites_invitee ON group_invites(invitee_id);
CREATE INDEX idx_group_invites_status ON group_invites(status);
CREATE INDEX idx_group_invites_expires_at ON group_invites(expires_at);
