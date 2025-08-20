# New Users Setup Guide

## Overview
This guide explains how to add 15 new users to the database and make them join the Ragnar tournament, expanding the tournament from 16 to 31 participants.

## Setup Instructions

### Prerequisites
1. Ensure your Supabase database is set up and running
2. The following scripts should already be executed:
   - `scripts/01-create-tables.sql` - Creates database tables
   - `scripts/02-create-functions.sql` - Creates database functions
   - `scripts/04-add-sample-players.sql` - Creates initial 16 users
   - `scripts/08-create-ragnar-tournament.sql` - Creates Ragnar tournament

### Execute the New Users Script
Run the following script in your Supabase SQL Editor:
- `scripts/10-add-15-new-users-to-ragnar.sql` - Adds 15 new users and joins them to Ragnar tournament

## What This Script Does

### 1. Tournament Expansion
- Updates Ragnar tournament max_participants from 16 to 31
- Updates current_participants to 31 to reflect new total
- Maintains tournament status as "ongoing"

### 2. New Users Created
The script creates 15 new sample users with unique gaming-themed usernames and diverse international names:

| Username | Full Name | User ID |
|----------|-----------|---------|
| FrostGuardian | Elena Volkov | 11111111-2222-3333-4444-555555555555 |
| NeonHunter | Marcus Chen | 22222222-3333-4444-5555-666666666666 |
| SolarFlare | Isabella Santos | 33333333-4444-5555-6666-777777777777 |
| CrimsonEdge | Dmitri Petrov | 44444444-5555-6666-7777-888888888888 |
| AquaStorm | Zara Al-Rashid | 55555555-6666-7777-8888-999999999999 |
| GhostRider | Kai Nakamura | 66666666-7777-8888-9999-aaaaaaaaaaaa |
| LightningBolt | Aria Johansson | 77777777-8888-9999-aaaa-bbbbbbbbbbbb |
| SteelTitan | Rafael García | 88888888-9999-aaaa-bbbb-cccccccccccc |
| ShadowPhoenix | Luna Rossi | 99999999-aaaa-bbbb-cccc-dddddddddddd |
| CosmicWave | Alexei Volkov | aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee |
| InfernoBlaze | Priya Sharma | bbbbbbbb-cccc-dddd-eeee-ffffffffffff |
| IceBreaker | Thor Anderson | cccccccc-dddd-eeee-ffff-000000000000 |
| WindWalker | Sakura Tanaka | dddddddd-eeee-ffff-0000-111111111111 |
| VoidStrike | Omar Hassan | eeeeeeee-ffff-0000-1111-222222222222 |
| NovaBlast | Celia Morrison | ffffffff-0000-1111-2222-333333333333 |

### 3. Tournament Participation
- All 15 new users are automatically added as participants to the Ragnar tournament
- Tournament now has 31/31 participants (original 16 + new 15)
- All participants have proper join timestamps

## Verification

The script includes verification queries that will show:
1. Tournament information with updated participant counts
2. Complete list of all tournament participants with their join dates

After running the script, you should see:
- **Tournament Info**: Ragnar Tournament with 31/31 participants
- **All Participants**: List of 31 users (16 original + 15 new)

## Features Demonstrated

With the expanded tournament, you can now test:
✅ **Large Tournament Management** (31 participants)
✅ **Diverse User Base** with international names
✅ **Tournament Capacity Management**
✅ **Participant Listing and Management**
✅ **Tournament Status with Full Participation**

## Tournament Access

- **Tournament ID**: `ragnar00-0000-0000-0000-000000000001`
- **Tournament Details**: `/tournaments/ragnar00-0000-0000-0000-000000000001`
- **Tournament Bracket**: `/tournaments/ragnar00-0000-0000-0000-000000000001/bracket`
- **Tournament Dashboard**: `/tournaments/ragnar00-0000-0000-0000-000000000001/dashboard`

## Sample User Credentials

All users are created with:
- **Unique UUID identifiers**
- **Gaming-themed usernames**
- **Diverse international full names**
- **Proper creation timestamps**

These users can be used for:
- Testing tournament participation
- Demonstrating user management features
- Testing authentication flows
- Simulating realistic tournament scenarios

The expanded Ragnar tournament now provides a comprehensive environment for testing all tournament management features with a realistic number of participants!
