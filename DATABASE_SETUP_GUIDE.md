# Database Setup Guide

This guide will help you set up a fresh database for the EsTournaments platform.

## Prerequisites

1. A Supabase project (create one at https://supabase.com)
2. Access to your project's SQL editor or the ability to run SQL scripts

## Setup Steps

### 1. Connect to Your New Database

1. Go to your Supabase project dashboard
2. Navigate to Project Settings > API
3. Copy your project URL and anon key
4. Update your environment variables in Vercel/v0:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Run the Database Scripts

Execute the SQL scripts in the following order:

1. `00-drop-all-tables.sql` - Cleans up any existing tables
2. `01-create-profiles-table.sql` - User profiles
3. `02-create-tournaments-table.sql` - Tournament data
4. `03-create-tournament-participants-table.sql` - Tournament participation
5. `04-create-matches-table.sql` - Tournament matches/brackets
6. `05-create-groups-table.sql` - User groups/communities
7. `06-create-group-members-table.sql` - Group membership
8. `07-create-group-invites-table.sql` - Group invitations
9. `08-create-friends-table.sql` - Friend relationships
10. `09-create-functions-and-triggers.sql` - Database functions and triggers
11. `10-insert-sample-data.sql` - Sample data (optional)
12. `11-setup-storage.sql` - File storage setup

### 3. Enable Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable email authentication
3. Configure any additional auth providers if needed
4. Set up email templates if desired

### 4. Test the Setup

1. Try creating a user account through your app
2. Verify that the profile is automatically created
3. Test creating a tournament
4. Test joining a tournament

## Database Schema Overview

### Core Tables

- **profiles**: User information and settings
- **tournaments**: Tournament details and configuration
- **tournament_participants**: Links users to tournaments they've joined
- **matches**: Individual matches within tournaments
- **groups**: User communities and teams
- **group_members**: Group membership tracking
- **group_invites**: Group invitation system
- **friends**: Friend/follower relationships

### Key Features

- **Row Level Security (RLS)**: All tables have appropriate security policies
- **Automatic Triggers**: Participant counts, timestamps, and user profiles are managed automatically
- **Foreign Key Constraints**: Ensures data integrity across relationships
- **Indexes**: Optimized for common query patterns
- **Storage Buckets**: Set up for tournament images, avatars, and group images

## Troubleshooting

### Common Issues

1. **Permission Errors**: Make sure you're using the service role key for admin operations
2. **Foreign Key Violations**: Ensure you run scripts in the correct order
3. **RLS Policies**: If queries fail, check that RLS policies allow the operation
4. **Missing Environment Variables**: Verify all Supabase environment variables are set

### Getting Help

- Check the Supabase documentation: https://supabase.com/docs
- Review the SQL scripts for any customizations needed
- Test with sample data before using in production

## Customization

You can modify the scripts to:
- Add additional fields to existing tables
- Create new tables for custom features
- Adjust RLS policies for your security requirements
- Add custom functions or triggers
- Modify sample data to match your needs
