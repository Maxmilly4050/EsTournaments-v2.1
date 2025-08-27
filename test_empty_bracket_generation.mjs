#!/usr/bin/env node

/**
 * Test script to verify empty bracket generation functionality
 * Tests the new generateEmptyBracket method with different participant counts
 */

import pkg from './lib/tournament/bracket-generator.js';
const { TournamentBracketGenerator } = pkg;

async function testEmptyBracketGeneration() {
  console.log('🧪 Testing Empty Bracket Generation')
  console.log('=' .repeat(50))

  const generator = new TournamentBracketGenerator()

  // Test cases with different participant counts
  const testCases = [
    { maxParticipants: 4, tournamentType: 'single_elimination', expectedMatches: 3 },
    { maxParticipants: 8, tournamentType: 'single_elimination', expectedMatches: 7 },
    { maxParticipants: 16, tournamentType: 'single_elimination', expectedMatches: 15 },
    { maxParticipants: 6, tournamentType: 'round_robin', expectedMatches: 15 }, // 6*5/2 = 15
    { maxParticipants: 8, tournamentType: 'round_robin', expectedMatches: 28 }, // 8*7/2 = 28
  ]

  for (const testCase of testCases) {
    console.log(`\n📋 Testing ${testCase.tournamentType} with ${testCase.maxParticipants} max participants`)

    try {
      const tournamentId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const tournamentConfig = {
        tournament_type: testCase.tournamentType,
        bracket_type: 'standard'
      }

      // Mock the saveMatches method to avoid database operations
      const originalSaveMatches = generator.saveMatches
      generator.saveMatches = async (matches) => {
        console.log(`   ✅ Generated ${matches.length} empty matches`)

        // Verify all matches have null player IDs (empty slots)
        const emptyMatches = matches.filter(match =>
          match.player1_id === null && match.player2_id === null
        )

        if (emptyMatches.length === matches.length) {
          console.log(`   ✅ All matches have empty player slots`)
        } else {
          console.log(`   ❌ Some matches have filled player slots`)
        }

        // Verify match structure
        if (testCase.tournamentType === 'single_elimination') {
          const rounds = matches.reduce((max, match) => Math.max(max, match.round), 0)
          const expectedRounds = Math.log2(generator.getNextPowerOfTwo(testCase.maxParticipants))

          if (rounds === expectedRounds) {
            console.log(`   ✅ Correct number of rounds: ${rounds}`)
          } else {
            console.log(`   ❌ Expected ${expectedRounds} rounds, got ${rounds}`)
          }
        }

        // Verify bracket positions are set
        const withBracketPositions = matches.filter(match => match.bracket_position)
        if (withBracketPositions.length === matches.length) {
          console.log(`   ✅ All matches have bracket positions`)
        } else {
          console.log(`   ❌ Some matches missing bracket positions`)
        }

        return matches
      }

      const matches = await generator.generateEmptyBracket(
        tournamentId,
        testCase.maxParticipants,
        tournamentConfig
      )

      if (testCase.expectedMatches && matches.length === testCase.expectedMatches) {
        console.log(`   ✅ Expected match count: ${matches.length}`)
      } else if (testCase.expectedMatches) {
        console.log(`   ⚠️  Expected ${testCase.expectedMatches} matches, got ${matches.length}`)
      }

      // Restore original method
      generator.saveMatches = originalSaveMatches

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  console.log('\n🎯 Testing edge cases')

  // Test minimum participants
  try {
    await generator.generateEmptyBracket('test', 2, { tournament_type: 'single_elimination' })
    console.log('   ✅ Minimum participants (2) works')
  } catch (error) {
    console.log(`   ❌ Minimum participants failed: ${error.message}`)
  }

  // Test maximum participants
  try {
    await generator.generateEmptyBracket('test', 128, { tournament_type: 'single_elimination' })
    console.log('   ✅ Maximum participants (128) works')
  } catch (error) {
    console.log(`   ❌ Maximum participants failed: ${error.message}`)
  }

  // Test invalid participant count
  try {
    await generator.generateEmptyBracket('test', 1, { tournament_type: 'single_elimination' })
    console.log('   ❌ Should have failed with 1 participant')
  } catch (error) {
    console.log('   ✅ Correctly rejected 1 participant')
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ Empty bracket generation testing completed!')
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmptyBracketGeneration().catch(console.error)
}

export { testEmptyBracketGeneration }
