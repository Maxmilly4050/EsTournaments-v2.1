-- Enhance profiles table with new user profile management fields
-- This script adds editable and non-editable fields for comprehensive profile management

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gamer_tag TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email_notifications": true, "match_notifications": true, "tournament_notifications": true}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "match_visibility": "public"}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_gamer_tag_change TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS konami_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ea_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS global_ranking INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_host_tournaments BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMP WITH TIME ZONE;

-- Create unique constraint on gamer_tag
ALTER TABLE profiles ADD CONSTRAINT unique_gamer_tag UNIQUE (gamer_tag);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_gamer_tag ON profiles(gamer_tag);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_global_ranking ON profiles(global_ranking);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);
