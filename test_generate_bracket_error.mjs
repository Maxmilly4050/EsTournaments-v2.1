#!/usr/bin/env node

/**
 * Test script to reproduce the generateBracket error
 * This script will test the TournamentBracketGenerator directly to identify issues
 */

import pkg from './lib/tournament/bracket-generator.js';
const { TournamentBracketGenerator } = pkg;

async function testGenerateBracket() {
  console.log('🧪 Testing Generate Bracket Error Reproduction')
  console.log('=' .repeat(50))

  try {
    const bracketGenerator = new TournamentBracketGenerator()

    // Test the getNextPowerOfTwo method specifically
    console.log('\n📋 Testing getNextPowerOfTwo method...')
    try {
      const result = bracketGenerator.getNextPowerOfTwo(8)
      console.log(`   ✅ getNextPowerOfTwo(8) = ${result}`)
    } catch (error) {
      console.log(`   ❌ getNextPowerOfTwo error: ${error.message}`)
    }

    // Test the generateEmptyBracket method with typical parameters
    console.log('\n📋 Testing generateEmptyBracket method...')

    const tournamentId = 'test-tournament-123'
    const maxParticipants = 8
    const tournamentConfig = {
      tournament_type: 'single_elimination',
      bracket_type: 'standard'
    }

    // Mock the saveMatches method to avoid database operations
    const originalSaveMatches = bracketGenerator.saveMatches
    bracketGenerator.saveMatches = async (matches) => {
      console.log(`   ✅ saveMatches called with ${matches.length} matches`)
      return matches
    }

    try {
      const matches = await bracketGenerator.generateEmptyBracket(
        tournamentId,
        maxParticipants,
        tournamentConfig
      )
      console.log(`   ✅ generateEmptyBracket successful: ${matches.length} matches`)
    } catch (error) {
      console.log(`   ❌ generateEmptyBracket error: ${error.message}`)
      console.log(`   Stack trace: ${error.stack}`)
    }

    // Restore original method
    bracketGenerator.saveMatches = originalSaveMatches

    // Test the specific line mentioned in the error (line 84 equivalent)
    console.log('\n📋 Testing bracket size calculation...')
    try {
      const bracketSize = bracketGenerator.getNextPowerOfTwo ? bracketGenerator.getNextPowerOfTwo(maxParticipants) : maxParticipants
      console.log(`   ✅ Bracket size calculation: ${bracketSize}`)
    } catch (error) {
      console.log(`   ❌ Bracket size calculation error: ${error.message}`)
    }

  } catch (error) {
    console.log(`❌ General error: ${error.message}`)
    console.log(`Stack trace: ${error.stack}`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('🔍 Test completed!')
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGenerateBracket().catch(console.error)
}

export { testGenerateBracket }
