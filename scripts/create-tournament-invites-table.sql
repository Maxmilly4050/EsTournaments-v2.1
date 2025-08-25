-- Create tournament_invites table for managing tournament invitations
CREATE TABLE IF NOT EXISTS public.tournament_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_invites_tournament_id ON public.tournament_invites(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_invites_invitee_id ON public.tournament_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_tournament_invites_status ON public.tournament_invites(status);
CREATE INDEX IF NOT EXISTS idx_tournament_invites_expires_at ON public.tournament_invites(expires_at);

-- Add unique constraint to prevent duplicate invitations
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_invites_unique ON public.tournament_invites(tournament_id, invitee_id)
WHERE status IN ('pending', 'accepted');

-- Enable RLS
ALTER TABLE public.tournament_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tournament invites are viewable by participants" ON public.tournament_invites
    FOR SELECT USING (
        auth.uid() = inviter_id OR
        auth.uid() = invitee_id OR
        EXISTS (
            SELECT 1 FROM public.tournaments t
            WHERE t.id = tournament_id AND t.created_by = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can send tournament invites" ON public.tournament_invites
    FOR INSERT WITH CHECK (
        auth.uid() = inviter_id AND
        EXISTS (
            SELECT 1 FROM public.tournaments t
            WHERE t.id = tournament_id
            AND (t.created_by = auth.uid() OR EXISTS (
                SELECT 1 FROM public.tournament_participants tp
                WHERE tp.tournament_id = t.id AND tp.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can update their own sent or received invites" ON public.tournament_invites
    FOR UPDATE USING (
        auth.uid() = inviter_id OR auth.uid() = invitee_id
    );

CREATE POLICY "Users can cancel their own invites" ON public.tournament_invites
    FOR DELETE USING (
        auth.uid() = inviter_id OR auth.uid() = invitee_id
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tournament_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tournament_invites_updated_at
    BEFORE UPDATE ON public.tournament_invites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tournament_invites_updated_at();

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_tournament_invites()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.tournament_invites
    WHERE status = 'pending' AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
