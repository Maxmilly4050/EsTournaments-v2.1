-- Fix infinite recursion in group_members RLS policies
-- Drop existing policies that might be causing circular dependencies
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can insert group members" ON group_members;
DROP POLICY IF EXISTS "Users can update group members" ON group_members;
DROP POLICY IF EXISTS "Users can delete group members" ON group_members;

-- Create simple, non-recursive policies for group_members
-- Policy 1: Users can view their own memberships
CREATE POLICY "Users can view own memberships" ON group_members
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Users can view memberships in groups they own
CREATE POLICY "Group owners can view all memberships" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.owner_id = auth.uid()
        )
    );

-- Policy 3: Users can insert themselves into groups (for joining)
CREATE POLICY "Users can join groups" ON group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 4: Group owners and admins can insert members
CREATE POLICY "Group owners can add members" ON group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.owner_id = auth.uid()
        )
    );

-- Policy 5: Users can remove themselves from groups
CREATE POLICY "Users can leave groups" ON group_members
    FOR DELETE USING (auth.uid() = user_id);

-- Policy 6: Group owners can remove any member
CREATE POLICY "Group owners can remove members" ON group_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.owner_id = auth.uid()
        )
    );

-- Policy 7: Group owners can update member roles
CREATE POLICY "Group owners can update member roles" ON group_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.owner_id = auth.uid()
        )
    );

-- Ensure RLS is enabled
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Also fix groups table policies to be simpler
DROP POLICY IF EXISTS "Users can view groups" ON groups;
DROP POLICY IF EXISTS "Users can insert groups" ON groups;
DROP POLICY IF EXISTS "Users can update groups" ON groups;
DROP POLICY IF EXISTS "Users can delete groups" ON groups;

-- Simple policies for groups table
CREATE POLICY "Anyone can view public groups" ON groups
    FOR SELECT USING (is_private = false OR owner_id = auth.uid());

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" ON groups
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups" ON groups
    FOR DELETE USING (auth.uid() = owner_id);

-- Ensure RLS is enabled for groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
