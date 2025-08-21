#!/usr/bin/env node

/**
 * Test script to reproduce the "Failed to save match result" error
 * Makes actual API calls to identify the database issue
 */

const fetch = require('node-fetch')

console.log('🧪 Testing Match Result Saving Error...\n')

async function testMatchReporting() {
  const baseUrl = 'http://localhost:3000'

  // Test 1: Match code only submission
  console.log('1️⃣ Testing match code only submission...')

  const matchCodePayload = {
    match_room_code: 'TEST123456',
    notes: 'Test match code submission'
  }

  try {
    const response = await fetch(`${baseUrl}/api/tournaments/matches/1/report-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(matchCodePayload)
    })

    const result = await response.json()
    console.log('Response status:', response.status)
    console.log('Response body:', JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.log('❌ Match code submission failed')
      if (result.debug) {
        console.log('Debug info:', JSON.stringify(result.debug, null, 2))
      }
    } else {
      console.log('✅ Match code submission successful')
    }
  } catch (error) {
    console.log('❌ Network error:', error.message)
  }

  console.log()

  // Test 2: Full result reporting
  console.log('2️⃣ Testing full result reporting...')

  const fullResultPayload = {
    winner_id: 'test-player-1',
    player1_score: 3,
    player2_score: 1,
    screenshot_url: 'screenshot_test.png',
    match_room_code: 'TEST123456',
    notes: 'Test full result submission'
  }

  try {
    const response = await fetch(`${baseUrl}/api/tournaments/matches/1/report-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fullResultPayload)
    })

    const result = await response.json()
    console.log('Response status:', response.status)
    console.log('Response body:', JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.log('❌ Full result submission failed')
      if (result.debug) {
        console.log('Debug info:', JSON.stringify(result.debug, null, 2))
      }
    } else {
      console.log('✅ Full result submission successful')
    }
  } catch (error) {
    console.log('❌ Network error:', error.message)
  }

  console.log()

  // Test 3: Check server logs for detailed error information
  console.log('3️⃣ Check server logs for error details...')
  console.log('Look for [DATABASE] error messages in the server console')
  console.log('The enhanced logging should show the exact database error')
}

// Run the test
testMatchReporting().catch(console.error)
