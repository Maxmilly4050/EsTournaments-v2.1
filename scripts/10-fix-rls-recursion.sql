-- Fix infinite recursion in RLS policies by simplifying them

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Group members are viewable by group members" ON group_members;
DROP POLICY IF EXISTS "Users can view their own group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group owners and admins can manage members" ON group_members;

-- Create simpler, non-recursive policies for group_members
CREATE POLICY "Users can view group memberships"
  ON group_members FOR SELECT
  USING (true); -- Allow all users to view group memberships (needed for public group discovery)

CREATE POLICY "Users can insert their own memberships"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memberships"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Group owners can manage all memberships"
  ON group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE groups.id = group_members.group_id 
      AND groups.owner_id = auth.uid()
    )
  );

-- Simplify groups policies
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON groups;
DROP POLICY IF EXISTS "Private groups are viewable by members" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group owners can update their groups" ON groups;
DROP POLICY IF EXISTS "Group owners can delete their groups" ON groups;

-- Create simpler group policies
CREATE POLICY "All users can view public groups"
  ON groups FOR SELECT
  USING (is_private = false OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups"
  ON groups FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups"
  ON groups FOR DELETE
  USING (auth.uid() = owner_id);

-- Update the trigger function to be simpler
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups 
    SET current_members = current_members + 1 
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups 
    SET current_members = GREATEST(current_members - 1, 0) 
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
