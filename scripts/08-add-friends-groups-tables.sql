-- Add Friends and Groups functionality to Tournament Platform
-- Run this script after the main database setup

-- Create friends table for following relationships
CREATE TABLE IF NOT EXISTS public.friends (
  id SERIAL PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 50,
  current_members INTEGER DEFAULT 1,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_invites table
CREATE TABLE IF NOT EXISTS public.group_invites (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(group_id, invitee_id)
);

-- Enable Row Level Security
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for friends
CREATE POLICY "Users can view their own friend relationships" ON public.friends 
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create friend requests" ON public.friends 
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update friend requests they're involved in" ON public.friends 
  FOR UPDATE USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can delete their own friend relationships" ON public.friends 
  FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Create RLS policies for groups
CREATE POLICY "Public groups are viewable by everyone" ON public.groups 
  FOR SELECT USING (NOT is_private OR EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create groups" ON public.groups 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);

CREATE POLICY "Group owners and admins can update groups" ON public.groups 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = groups.id 
      AND group_members.user_id = auth.uid() 
      AND group_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Group owners can delete groups" ON public.groups 
  FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for group_members
CREATE POLICY "Group members are viewable by group members" ON public.group_members 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups via invites" ON public.group_members 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      -- Public group or has valid invite
      EXISTS (SELECT 1 FROM public.groups WHERE groups.id = group_id AND NOT groups.is_private)
      OR EXISTS (
        SELECT 1 FROM public.group_invites 
        WHERE group_invites.group_id = group_members.group_id 
        AND group_invites.invitee_id = auth.uid() 
        AND group_invites.status = 'accepted'
        AND group_invites.expires_at > NOW()
      )
    )
  );

CREATE POLICY "Group owners and admins can manage members" ON public.group_members 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can leave groups" ON public.group_members 
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for group_invites
CREATE POLICY "Users can view invites they sent or received" ON public.group_invites 
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Group members can send invites" ON public.group_invites 
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = group_invites.group_id 
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Invitees can update their invites" ON public.group_invites 
  FOR UPDATE USING (auth.uid() = invitee_id);

CREATE POLICY "Inviters can delete their invites" ON public.group_invites 
  FOR DELETE USING (auth.uid() = inviter_id);

-- Create function to update group member count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups 
    SET current_members = current_members + 1 
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups 
    SET current_members = current_members - 1 
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for group member count
DROP TRIGGER IF EXISTS group_member_count_trigger ON public.group_members;
CREATE TRIGGER group_member_count_trigger
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- Create function to auto-add group owner as member
CREATE OR REPLACE FUNCTION public.add_group_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-add group owner as member
DROP TRIGGER IF EXISTS add_group_owner_trigger ON public.groups;
CREATE TRIGGER add_group_owner_trigger
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_group_owner_as_member();

-- Insert sample groups
INSERT INTO public.groups (name, description, is_private, max_members, owner_id) VALUES
('Pro Gamers Alliance', 'Elite gaming community for professional esports players', false, 100, (SELECT id FROM auth.users LIMIT 1)),
('Street Fighter Masters', 'Dedicated to mastering the art of Street Fighter', false, 50, (SELECT id FROM auth.users LIMIT 1)),
('Valorant Tactical Squad', 'Strategic gameplay and team coordination', true, 25, (SELECT id FROM auth.users LIMIT 1)),
('Casual Gaming Hub', 'Relaxed gaming community for all skill levels', false, 200, (SELECT id FROM auth.users LIMIT 1)),
('Tournament Organizers', 'Community for tournament organizers and admins', true, 30, (SELECT id FROM auth.users LIMIT 1));

-- Success message
SELECT 'Friends and Groups tables created successfully!' as status;
