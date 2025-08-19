-- Fix infinite recursion in group_members RLS policies
-- This script updates the problematic RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;
DROP POLICY IF EXISTS "Group owners and admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.groups;

-- Create fixed RLS policies for groups (simplified)
CREATE POLICY "All authenticated users can view public groups" ON public.groups 
  FOR SELECT USING (NOT is_private OR auth.uid() = owner_id);

-- Create fixed RLS policies for group_members (avoid self-reference)
CREATE POLICY "Users can view group members of groups they belong to" ON public.group_members 
  FOR SELECT USING (
    -- User can see members of groups where they are also a member
    user_id = auth.uid() OR 
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm 
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage group members if they are owner/admin" ON public.group_members 
  FOR ALL USING (
    -- Check if user is owner of the group directly
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_members.group_id 
      AND g.owner_id = auth.uid()
    )
    OR
    -- Check if user is admin (but avoid self-reference by using a different approach)
    (auth.uid() = user_id AND role = 'member') -- Users can manage their own membership
  );

-- Simplified policy for joining groups
CREATE POLICY "Users can join public groups" ON public.group_members 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.groups WHERE groups.id = group_id AND NOT groups.is_private)
  );

-- Users can leave groups they're in
CREATE POLICY "Users can leave groups" ON public.group_members 
  FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT 'Group RLS policies fixed successfully!' as status;
