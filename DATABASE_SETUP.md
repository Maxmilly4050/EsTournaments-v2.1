# Database Setup Instructions

Your tournament platform database is ready! Run these SQL scripts in order in your Supabase SQL Editor:

## Required Scripts (Run in Order):

1. **scripts/01-create-tables.sql** - Creates all database tables and security policies
2. **scripts/02-create-functions.sql** - Creates triggers for user profiles and participant counts
3. **scripts/07-add-phone-number-field.sql** - Adds phone number support to profiles
4. **scripts/04-add-sample-players.sql** - Creates 16 sample player profiles
5. **scripts/03-add-dummy-data.sql** - Creates 6 sample tournaments with matches
6. **scripts/05-add-tournament-participants.sql** - Adds participants to tournaments
7. **scripts/06-add-detailed-matches.sql** - Creates complete bracket data with match results

## What You'll Get:

- **User Authentication**: Complete signup/login with phone numbers and Google OAuth
- **Tournament Management**: Create, join, and manage tournaments
- **Bracket System**: Full tournament brackets with match progression
- **Sample Data**: 6 tournaments across different games with realistic participants and matches

## Features Included:

✅ User profiles with phone number collection
✅ Google OAuth authentication
✅ Tournament creation and joining
✅ Interactive tournament brackets
✅ Match progression and winner tracking
✅ Participant management with seeding
✅ Real-time tournament status updates

Run the scripts in your Supabase dashboard and your tournament platform will be fully functional!
