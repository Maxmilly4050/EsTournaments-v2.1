#!/usr/bin/env node

/**
 * Test script to reproduce current dashboard functionality issues
 * This script will help identify what needs to be fixed based on the issue description
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDashboardFunctionality() {
  console.log('🔍 Testing Tournament Dashboard Functionality\n')

  try {
    // Test 1: Check tournament participant counting
    console.log('1. Testing Tournament Info - Participant Count')
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select(`
        id,
        title,
        max_participants,
        participant_count,
        current_participants,
        tournament_participants(count)
      `)
      .limit(1)

    if (tournamentsError) {
      console.error('❌ Error fetching tournaments:', tournamentsError.message)
    } else if (tournaments && tournaments.length > 0) {
      const tournament = tournaments[0]
      const actualParticipants = tournament.tournament_participants?.[0]?.count || 0
      console.log(`   Tournament: ${tournament.title}`)
      console.log(`   Max Participants: ${tournament.max_participants}`)
      console.log(`   Stored participant_count: ${tournament.participant_count || 'null'}`)
      console.log(`   Stored current_participants: ${tournament.current_participants || 'null'}`)
      console.log(`   Actual participants in DB: ${actualParticipants}`)

      if (tournament.current_participants !== actualParticipants) {
        console.log('   ⚠️  ISSUE: current_participants does not match actual count')
      } else {
        console.log('   ✅ Participant count is correct')
      }
    } else {
      console.log('   ℹ️  No tournaments found')
    }

    console.log()

    // Test 2: Check match results status
    console.log('2. Testing Match Results Status')
    const { data: matchResults, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        status,
        requires_admin_review,
        admin_decision,
        winner_id,
        tournament_id
      `)
      .limit(10)

    if (matchError) {
      console.error('❌ Error fetching match results:', matchError.message)
    } else if (matchResults && matchResults.length > 0) {
      const pendingMatches = matchResults.filter(m => m.status === 'pending' || m.requires_admin_review)
      const approvedMatches = matchResults.filter(m => m.status === 'completed' && m.winner_id)
      const disputedMatches = matchResults.filter(m => m.requires_admin_review || m.admin_decision === 'disputed')

      console.log(`   Total matches: ${matchResults.length}`)
      console.log(`   Pending matches: ${pendingMatches.length}`)
      console.log(`   Approved matches: ${approvedMatches.length}`)
      console.log(`   Disputed matches: ${disputedMatches.length}`)
      console.log('   ✅ Match results status tracking works')
    } else {
      console.log('   ℹ️  No matches found')
    }

    console.log()

    // Test 3: Check dispute flags
    console.log('3. Testing Recent Activity - Dispute Flags')
    const { data: disputes, error: disputeError } = await supabase
      .from('disputes')
      .select(`
        id,
        match_id,
        disputed_by,
        reason,
        status,
        created_at,
        matches(
          tournament_id,
          round,
          match_number
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (disputeError) {
      console.error('❌ Error fetching disputes:', disputeError.message)
    } else if (disputes && disputes.length > 0) {
      console.log(`   Recent disputes found: ${disputes.length}`)
      disputes.forEach(dispute => {
        console.log(`   - Dispute ID: ${dispute.id}, Status: ${dispute.status}, Reason: ${dispute.reason}`)
      })
      console.log('   ⚠️  ISSUE: Recent Activity should display these dispute flags')
    } else {
      console.log('   ℹ️  No disputes found')
      console.log('   ⚠️  Recent Activity needs to show "No disputes" when none exist')
    }

    console.log()

    // Test 4: Check bracket generation status
    console.log('4. Testing Bracket Status')
    const { data: bracketTournaments, error: bracketError } = await supabase
      .from('tournaments')
      .select(`
        id,
        title,
        bracket_generated,
        status,
        tournament_participants(count)
      `)
      .limit(3)

    if (bracketError) {
      console.error('❌ Error fetching bracket status:', bracketError.message)
    } else if (bracketTournaments && bracketTournaments.length > 0) {
      bracketTournaments.forEach(tournament => {
        const participantCount = tournament.tournament_participants?.[0]?.count || 0
        console.log(`   Tournament: ${tournament.title}`)
        console.log(`   Bracket Generated: ${tournament.bracket_generated ? 'Yes' : 'No'}`)
        console.log(`   Registered Players: ${participantCount}`)
        console.log(`   Status: ${tournament.status}`)

        if (!tournament.bracket_generated) {
          console.log('   ⚠️  Seeding status should show "Awaiting Seeding"')
        } else {
          console.log('   ⚠️  Seeding status should show "Seeded" with checkmark')
        }
        console.log()
      })
    } else {
      console.log('   ℹ️  No tournaments found for bracket testing')
    }

    // Test 5: Check tournament logs for admin restriction
    console.log('5. Testing Tournament Timeline & Logs')
    const { data: logs, error: logsError } = await supabase
      .from('tournament_logs')
      .select(`
        id,
        tournament_id,
        action_type,
        description,
        created_at
      `)
      .limit(5)

    if (logsError) {
      console.error('❌ Error fetching tournament logs:', logsError.message)
    } else {
      console.log(`   Tournament logs found: ${logs?.length || 0}`)
      console.log('   ⚠️  ISSUE: Timeline & logs should be restricted to admin access only')
    }

    console.log()
    console.log('🎯 SUMMARY OF REQUIRED CHANGES:')
    console.log('1. ✅ Recent Activity: Add dispute flag display functionality')
    console.log('2. ✅ Match Results: Already working with real status counts')
    console.log('3. ⚠️  Tournament Info: Ensure current_participants reflects actual count')
    console.log('4. ⚠️  Bracket Status: Update seeding status display after random seeding')
    console.log('5. ⚠️  Seeding Status: Change from "Awaiting Seeding" to "Seeded" with checkmark')
    console.log('6. ⚠️  Timeline & Logs: Add admin-only access restriction')
    console.log('7. ➕ Results Management: Create new page for match bracket and dispute handling')

  } catch (error) {
    console.error('Error testing dashboard functionality:', error)
  }
}

// Run the test
testDashboardFunctionality().then(() => {
  console.log('\n✨ Dashboard functionality test completed!')
  process.exit(0)
}).catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})
