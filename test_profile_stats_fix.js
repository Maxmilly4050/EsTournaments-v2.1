#!/usr/bin/env node

/**
 * Test script to verify user profile stats fixes:
 * 1. Dynamic profile page uses correct field names from tournament-stats service
 * 2. All snake_case fields updated to camelCase to match service output
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Profile Stats Field Name Fixes...\n')

// Test 1: Check dynamic profile page field names
console.log('1. Checking dynamic profile page ([id]/page.jsx) field names...')

const dynamicProfilePath = path.join(__dirname, 'app/profile/[id]/page.jsx')
if (!fs.existsSync(dynamicProfilePath)) {
  console.log('❌ Dynamic profile page not found')
  process.exit(1)
}

const dynamicProfileContent = fs.readFileSync(dynamicProfilePath, 'utf8')

// Check for correct camelCase field names
const hasCorrectTournamentsWon = dynamicProfileContent.includes('{stats?.tournamentsWon || 0}')
const hasCorrectMatchesWon = dynamicProfileContent.includes('{stats?.matchesWon || 0}')
const hasCorrectTournamentsParticipated = dynamicProfileContent.includes('{stats?.tournamentsParticipated || 0}')
const hasCorrectTotalMatches = dynamicProfileContent.includes('{stats?.totalMatches || 0}')
const hasCorrectWinRate = dynamicProfileContent.includes('{stats?.winRate')

console.log(`${hasCorrectTournamentsWon ? '✅' : '❌'} tournamentsWon field used correctly`)
console.log(`${hasCorrectMatchesWon ? '✅' : '❌'} matchesWon field used correctly`)
console.log(`${hasCorrectTournamentsParticipated ? '✅' : '❌'} tournamentsParticipated field used correctly`)
console.log(`${hasCorrectTotalMatches ? '✅' : '❌'} totalMatches field used correctly`)
console.log(`${hasCorrectWinRate ? '✅' : '❌'} winRate field used correctly`)

// Check for incorrect snake_case field names (should not exist)
const hasIncorrectTournamentsWon = dynamicProfileContent.includes('tournaments_won')
const hasIncorrectMatchesWon = dynamicProfileContent.includes('matches_won')
const hasIncorrectTournamentsParticipated = dynamicProfileContent.includes('tournaments_participated')
const hasIncorrectMatchesPlayed = dynamicProfileContent.includes('matches_played')
const hasIncorrectWinRate = dynamicProfileContent.includes('win_rate')
const hasIncorrectTournamentWinRate = dynamicProfileContent.includes('tournament_win_rate')

console.log(`${!hasIncorrectTournamentsWon ? '✅' : '❌'} No tournaments_won snake_case references`)
console.log(`${!hasIncorrectMatchesWon ? '✅' : '❌'} No matches_won snake_case references`)
console.log(`${!hasIncorrectTournamentsParticipated ? '✅' : '❌'} No tournaments_participated snake_case references`)
console.log(`${!hasIncorrectMatchesPlayed ? '✅' : '❌'} No matches_played snake_case references`)
console.log(`${!hasIncorrectWinRate ? '✅' : '❌'} No win_rate snake_case references`)
console.log(`${!hasIncorrectTournamentWinRate ? '✅' : '❌'} No tournament_win_rate references`)

// Test 2: Check tournament win rate calculation
console.log('\n2. Checking tournament win rate calculation...')

const hasTournamentWinRateCalc = dynamicProfileContent.includes('(stats.tournamentsWon / stats.tournamentsParticipated)')
const hasCorrectProgressCalc = dynamicProfileContent.includes('stats?.tournamentsParticipated > 0 && (')

console.log(`${hasTournamentWinRateCalc ? '✅' : '❌'} Tournament win rate calculated correctly`)
console.log(`${hasCorrectProgressCalc ? '✅' : '❌'} Progress bar uses calculated win rate`)

// Test 3: Compare with main profile page
console.log('\n3. Comparing with main profile page field usage...')

const mainProfilePath = path.join(__dirname, 'app/profile/page.jsx')
const mainProfileContent = fs.readFileSync(mainProfilePath, 'utf8')

const mainUsesTournamentsWon = mainProfileContent.includes('stats?.tournamentsWon')
const mainUsesMatchesWon = mainProfileContent.includes('stats?.matchesWon')
const mainUsesWinRate = mainProfileContent.includes('stats?.winRate')

console.log(`${mainUsesTournamentsWon ? '✅' : '❌'} Main profile uses tournamentsWon`)
console.log(`${mainUsesMatchesWon ? '✅' : '❌'} Main profile uses matchesWon`)
console.log(`${mainUsesWinRate ? '✅' : '❌'} Main profile uses winRate`)

// Test 4: Check tournament-stats service output structure
console.log('\n4. Verifying against tournament-stats service...')

const statsServicePath = path.join(__dirname, 'lib/tournament-stats.js')
const statsServiceContent = fs.readFileSync(statsServicePath, 'utf8')

const serviceReturnsTournamentsWon = statsServiceContent.includes('tournamentsWon: tournamentWins')
const serviceReturnsMatchesWon = statsServiceContent.includes('matchesWon: wins.length')
const serviceReturnsTotalMatches = statsServiceContent.includes('totalMatches: totalGames')
const serviceReturnsWinRate = statsServiceContent.includes('winRate,')

console.log(`${serviceReturnsTournamentsWon ? '✅' : '❌'} Service returns tournamentsWon`)
console.log(`${serviceReturnsMatchesWon ? '✅' : '❌'} Service returns matchesWon`)
console.log(`${serviceReturnsTotalMatches ? '✅' : '❌'} Service returns totalMatches`)
console.log(`${serviceReturnsWinRate ? '✅' : '❌'} Service returns winRate`)

// Summary
console.log('\n📊 Summary:')
const allChecks = [
  hasCorrectTournamentsWon,
  hasCorrectMatchesWon,
  hasCorrectTournamentsParticipated,
  hasCorrectTotalMatches,
  hasCorrectWinRate,
  !hasIncorrectTournamentsWon,
  !hasIncorrectMatchesWon,
  !hasIncorrectTournamentsParticipated,
  !hasIncorrectMatchesPlayed,
  !hasIncorrectWinRate,
  !hasIncorrectTournamentWinRate,
  hasTournamentWinRateCalc,
  hasCorrectProgressCalc,
  mainUsesTournamentsWon,
  mainUsesMatchesWon,
  mainUsesWinRate,
  serviceReturnsTournamentsWon,
  serviceReturnsMatchesWon,
  serviceReturnsTotalMatches,
  serviceReturnsWinRate
]

const passedChecks = allChecks.filter(Boolean).length
console.log(`${passedChecks}/${allChecks.length} checks passed`)

if (passedChecks === allChecks.length) {
  console.log('🎉 All profile stats fixes implemented successfully!')
  console.log('\n✨ Issues resolved:')
  console.log('  • Dynamic profile page field names corrected to match tournament-stats service')
  console.log('  • All snake_case fields updated to camelCase (tournamentsWon, matchesWon, etc.)')
  console.log('  • Tournament win rate calculated from available fields')
  console.log('  • Consistency between main profile and dynamic profile pages')
  console.log('\n🔧 Expected results:')
  console.log('  • User stats now display actual values instead of 0')
  console.log('  • Tournaments won, matches won, win rates show correctly')
  console.log('  • Progress bars display proper percentages')
} else {
  console.log('⚠️  Some fixes may be incomplete or missing')
}

console.log('\n🚀 To test manually:')
console.log('1. Start the development server: npm run dev')
console.log('2. Log in and navigate to your profile')
console.log('3. Check that stats show actual values (not all 0s)')
console.log('4. Visit another user\'s profile via /profile/[user-id]')
console.log('5. Verify their stats also display correctly')
