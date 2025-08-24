#!/usr/bin/env node

/**
 * Test script to reproduce the win rate calculation issue
 * This will simulate different scenarios to find what causes 10000%
 */

console.log('🧪 Testing Win Rate Calculation Scenarios...\n')

// Simulate the current win rate calculation from tournament-stats.js
function calculateWinRate(wins, losses) {
  const totalGames = wins + losses
  return totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
}

// Test scenarios
const testScenarios = [
  { name: 'Normal case: 1 win, 1 loss', wins: 1, losses: 1 },
  { name: 'Perfect record: 1 win, 0 losses', wins: 1, losses: 0 },
  { name: 'No wins: 0 wins, 1 loss', wins: 0, losses: 1 },
  { name: 'No games: 0 wins, 0 losses', wins: 0, losses: 0 },
  { name: 'Multiple games: 3 wins, 2 losses', wins: 3, losses: 2 },
  { name: 'Edge case: 1 win, 0.01 losses', wins: 1, losses: 0.01 },
  { name: 'Floating point: 1.5 wins, 0.5 losses', wins: 1.5, losses: 0.5 }
]

console.log('📊 Testing Win Rate Calculations:')
console.log('─'.repeat(60))

testScenarios.forEach(scenario => {
  const winRate = calculateWinRate(scenario.wins, scenario.losses)
  const status = winRate > 100 ? '⚠️ ISSUE' : winRate === 10000 ? '🚨 FOUND IT' : '✅ OK'
  console.log(`${status} ${scenario.name}`)
  console.log(`   Wins: ${scenario.wins}, Losses: ${scenario.losses}`)
  console.log(`   Calculated: ${winRate}%`)
  console.log()
})

// Now let's check what could cause 10000%
console.log('🔍 Analyzing potential causes of 10000%:')
console.log('─'.repeat(60))

// If 10000% = 100 * 100, then somewhere a percentage is being treated as decimal
console.log('Scenario A: Double multiplication')
const percentageAsDecimal = 100 // Already a percentage
const doubleMultiplied = percentageAsDecimal * 100
console.log(`If winRate is already 100% and gets * 100: ${doubleMultiplied}%`)

// Check what happens if totalGames is very small
console.log('\nScenario B: Very small totalGames')
const verySmallTotal = 0.01
const result = Math.round((1 / verySmallTotal) * 100)
console.log(`If totalGames = 0.01: ${result}%`)

// Check what happens if wins is much larger than expected
console.log('\nScenario C: Data corruption')
const corruptedResult = Math.round((100 / 1) * 100)
console.log(`If wins = 100, losses = 1: ${corruptedResult}%`)

console.log('\n🎯 Most likely cause:')
console.log('The 10000% suggests that a win rate of 100% is being')
console.log('multiplied by 100 again somewhere in the pipeline.')
console.log()
console.log('This could happen if:')
console.log('1. A percentage value (100) is mistakenly treated as decimal (1.00)')
console.log('2. The calculation runs twice on the same data')
console.log('3. There\'s a data type conversion issue')
console.log('4. An edge case where wins/losses are incorrectly counted')

console.log('\n🔧 Recommended fixes:')
console.log('1. Add bounds checking: Math.min(calculatedWinRate, 100)')
console.log('2. Add data validation before calculation')
console.log('3. Add debugging logs to track intermediate values')
console.log('4. Ensure win rate is only calculated once per user')
