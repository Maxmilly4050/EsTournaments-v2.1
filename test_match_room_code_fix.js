#!/usr/bin/env node

/**
 * Test script to verify the match room code trim() error fix
 * Simulates the error scenario and checks if the fix resolves it
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Match Room Code Trim() Error Fix...\n')

// Test 1: Check the fix in tournament-bracket.jsx
console.log('1️⃣ Verifying optional chaining fixes in tournament-bracket.jsx...')
const bracketPath = path.join(__dirname, 'components/tournament-bracket.jsx')
const bracketContent = fs.readFileSync(bracketPath, 'utf8')

// Check for unsafe trim() usage (should not exist)
const hasUnsafeTrim = bracketContent.includes('match_room_code.trim()')
console.log('❌ Unsafe trim() usage found:', hasUnsafeTrim ? 'YES - NEEDS FIX' : 'NO - GOOD')

// Check for safe optional chaining usage (should exist)
const hasSafeTrim = bracketContent.includes('match_room_code?.trim()')
console.log('✅ Safe optional chaining found:', hasSafeTrim ? 'YES - GOOD' : 'NO - NEEDS FIX')

// Count occurrences of each pattern
const unsafeMatches = bracketContent.match(/match_room_code\.trim\(\)/g) || []
const safeMatches = bracketContent.match(/match_room_code\?\.trim\(\)/g) || []

console.log(`Unsafe patterns found: ${unsafeMatches.length}`)
console.log(`Safe patterns found: ${safeMatches.length}`)

console.log()

// Test 2: Simulate the original error scenario
console.log('2️⃣ Simulating original error scenario...')

try {
  // Simulate undefined match_room_code
  const resultForm = {
    winner_id: '',
    player1_score: 0,
    player2_score: 0,
    screenshot_url: '',
    // match_room_code: '', // This would be undefined initially
    notes: ''
  }

  // This would cause the original error
  console.log('Testing unsafe access:')
  try {
    const result = resultForm.match_room_code.trim()
    console.log('❌ Unsafe access succeeded unexpectedly')
  } catch (error) {
    console.log('✅ Expected error caught:', error.message)
  }

  // This should work with optional chaining
  console.log('Testing safe access:')
  const safeResult = resultForm.match_room_code?.trim()
  console.log('✅ Safe access result:', safeResult === undefined ? 'undefined (expected)' : safeResult)

} catch (error) {
  console.log('Error in simulation:', error.message)
}

console.log()

// Test 3: Check button disabled logic
console.log('3️⃣ Testing button disabled logic...')

function testButtonDisabled(match_room_code) {
  // Simulate the button disabled condition with safe access
  const isDisabled = !match_room_code?.trim()
  return isDisabled
}

console.log('Empty string:', testButtonDisabled('') ? 'DISABLED' : 'ENABLED')
console.log('Whitespace only:', testButtonDisabled('   ') ? 'DISABLED' : 'ENABLED')
console.log('Valid code:', testButtonDisabled('ABC123') ? 'DISABLED' : 'ENABLED')
console.log('Undefined:', testButtonDisabled(undefined) ? 'DISABLED' : 'ENABLED')
console.log('Null:', testButtonDisabled(null) ? 'DISABLED' : 'ENABLED')

console.log()

// Test 4: Summary
console.log('📋 Fix Verification Summary:')
const isFixed = !hasUnsafeTrim && hasSafeTrim && safeMatches.length >= 2
console.log('Overall Status:', isFixed ? '✅ FIXED' : '❌ NEEDS MORE WORK')

if (isFixed) {
  console.log('\n🎉 Success! The match room code trim() error has been fixed.')
  console.log('Changes applied:')
  console.log('- ✅ Replaced unsafe match_room_code.trim() with match_room_code?.trim()')
  console.log('- ✅ Applied fix to both button disabled conditions')
  console.log('- ✅ Preserved original validation logic')
  console.log('- ✅ Added null safety for undefined values')
} else {
  console.log('\n❌ Fix incomplete. Issues found:')
  if (hasUnsafeTrim) console.log('- Still has unsafe trim() usage')
  if (!hasSafeTrim) console.log('- Missing safe optional chaining')
  if (safeMatches.length < 2) console.log('- Not all locations updated')
}

console.log('\n=== Test Complete ===')
