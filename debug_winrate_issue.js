#!/usr/bin/env node

/**
 * Debug script to investigate the win rate calculation issue
 * This script will help identify why win rates are showing as 10000%
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Debugging Win Rate Issue...\n')

// Read the tournament-stats service
const statsServicePath = path.join(__dirname, 'lib/tournament-stats.js')
const statsContent = fs.readFileSync(statsServicePath, 'utf8')

console.log('📋 Analyzing Win Rate Calculation Logic:')
console.log('━'.repeat(50))

// Extract the win rate calculation section
const lines = statsContent.split('\n')
const winRateLineIndex = lines.findIndex(line => line.includes('Calculate win rate'))
const relevantLines = lines.slice(winRateLineIndex, winRateLineIndex + 10)

console.log('Current win rate calculation:')
relevantLines.forEach((line, index) => {
  const lineNum = winRateLineIndex + index + 1
  console.log(`Line ${lineNum}: ${line}`)
})

console.log('\n🔍 Potential Issues Identified:')

// Check for double multiplication
const hasDoubleMultiplication = statsContent.includes('* 100') && statsContent.includes('Math.round')
console.log(`${hasDoubleMultiplication ? '⚠️' : '✅'} Checking for double multiplication by 100`)

// Check if there's any percentage conversion elsewhere
const percentageOccurrences = (statsContent.match(/\* 100/g) || []).length
console.log(`📊 Found ${percentageOccurrences} occurrences of "* 100" in the file`)

// Check the profile display logic
const profilePath = path.join(__dirname, 'app/profile/page.jsx')
const profileContent = fs.readFileSync(profilePath, 'utf8')

const winRateDisplayLine = profileContent.split('\n').find(line =>
  line.includes('winRate') && line.includes('%')
)

console.log('\n📱 Profile Display Logic:')
console.log('Win rate display line:', winRateDisplayLine?.trim() || 'Not found')

// Check if there's any additional percentage formatting
const hasAdditionalFormatting = profileContent.includes('winRate') &&
                                profileContent.includes('* 100')
console.log(`${hasAdditionalFormatting ? '⚠️' : '✅'} Additional percentage formatting in profile`)

console.log('\n🧠 Analysis:')
console.log('The tournament-stats service calculates:')
console.log('  winRate = (wins.length / totalGames) * 100')
console.log('  This should produce values like 50, 75, 100 for 50%, 75%, 100%')
console.log('')
console.log('The profile displays:')
console.log('  {stats?.winRate || 0}%')
console.log('  This adds a % sign to the already calculated percentage')

console.log('\n🔍 Possible Root Causes:')
console.log('1. Data issue: totalGames might be 0 or very small')
console.log('2. Match filtering issue: wins/losses not calculated correctly')
console.log('3. Double percentage calculation somewhere')
console.log('4. Edge case with specific user data')

console.log('\n🎯 Next Steps:')
console.log('1. Test with actual user data to see calculated values')
console.log('2. Add debugging logs to see intermediate calculations')
console.log('3. Check if 10000% = 100 * 100 (double multiplication)')

// Look for any other win rate calculations
console.log('\n🔎 Searching for other win rate calculations...')
const otherWinRateMatches = statsContent.match(/winRate.*=/g) || []
console.log('Other winRate assignments found:', otherWinRateMatches.length)
otherWinRateMatches.forEach(match => console.log('  -', match))

console.log('\n' + '━'.repeat(50))
console.log('Debug analysis complete. Check the logic and test with real data.')
