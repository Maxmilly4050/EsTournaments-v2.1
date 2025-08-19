# Supabase Database Setup Guide

## Quick Setup Instructions

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project
   - Click on "SQL Editor" in the left sidebar

2. **Run the Setup Script**
   - Copy the entire content from `scripts/00-complete-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Verify Setup**
   - Go to "Table Editor" in the left sidebar
   - You should see 4 tables: `profiles`, `tournaments`, `tournament_participants`, `matches`
   - The `tournaments` table should have 6 sample tournaments

## What This Creates

- **User Profiles**: Extended user data with phone numbers
- **Tournaments**: Complete tournament management system
- **Participants**: Tournament registration and seeding
- **Matches**: Bracket system with match results
- **Sample Data**: 6 tournaments across different games
- **Security**: Row Level Security policies for data protection

## Troubleshooting

If you encounter any errors:
1. Make sure you're using the SQL Editor (not the Table Editor)
2. Run the script in a fresh SQL Editor tab
3. Check that your Supabase project has the necessary permissions

## Next Steps

After running the setup script, your tournament platform will be fully functional with:
- User authentication and profiles
- Tournament creation and joining
- Bracket visualization
- Sample tournaments to explore
