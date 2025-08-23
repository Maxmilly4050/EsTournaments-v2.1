#!/usr/bin/env node

/**
 * Script to reproduce the TournamentBracket prop chain error
 * Tests various scenarios where tournament properties might be undefined
 */

console.log("🔍 Reproducing TournamentBracket Prop Chain Error");
console.log("=".repeat(50));

// Simulate different tournament data scenarios
const testScenarios = [
  {
    name: "Complete fallback tournament (should work)",
    tournament: {
      id: "1",
      title: "eFootball 2026 Championship",
      tournament_type: "single_elimination",
      game: "eFootball 2026",
      status: "upcoming"
    }
  },
  {
    name: "Tournament with undefined id (ERROR CASE)",
    tournament: {
      id: undefined,
      title: "Test Tournament",
      tournament_type: "single_elimination",
      game: "Test Game",
      status: "upcoming"
    }
  },
  {
    name: "Tournament with null id (ERROR CASE)",
    tournament: {
      id: null,
      title: "Test Tournament",
      tournament_type: "single_elimination",
      game: "Test Game",
      status: "upcoming"
    }
  },
  {
    name: "Tournament with undefined tournament_type (ERROR CASE)",
    tournament: {
      id: "1",
      title: "Test Tournament",
      tournament_type: undefined,
      game: "Test Game",
      status: "upcoming"
    }
  },
  {
    name: "Tournament with null tournament_type (ERROR CASE)",
    tournament: {
      id: "1",
      title: "Test Tournament",
      tournament_type: null,
      game: "Test Game",
      status: "upcoming"
    }
  },
  {
    name: "Completely undefined tournament (CRITICAL ERROR)",
    tournament: undefined
  },
  {
    name: "Null tournament (CRITICAL ERROR)",
    tournament: null
  },
  {
    name: "Empty tournament object (ERROR CASE)",
    tournament: {}
  }
];

console.log("📋 Testing Tournament Data Scenarios:");
console.log("-".repeat(50));

function simulateTournamentBracketProps(tournament, user = { id: "user123" }) {
  try {
    if (!tournament) {
      throw new Error("Tournament object is null or undefined");
    }

    // Simulate the prop extraction from TournamentDetails lines 167-171
    const tournamentId = tournament.id;
    const tournamentType = tournament.tournament_type;
    const isOrganizer = false; // Simplified for testing

    // Check what TournamentBracket would receive
    console.log(`   Props passed to TournamentBracket:`);
    console.log(`     tournamentId: ${tournamentId} (type: ${typeof tournamentId})`);
    console.log(`     tournamentType: ${tournamentType} (type: ${typeof tournamentType})`);
    console.log(`     isOrganizer: ${isOrganizer}`);

    // Simulate the checks that could cause errors in TournamentBracket
    if (!tournamentId) {
      throw new Error("tournamentId is falsy - would cause fetchMatches() to fail");
    }

    if (typeof tournamentId !== 'string' && typeof tournamentId !== 'number') {
      throw new Error("tournamentId is not a string or number - could cause API issues");
    }

    // Check for potential React rendering issues
    if (tournamentType === undefined || tournamentType === null) {
      console.log(`   ⚠️  WARNING: tournamentType is ${tournamentType} - might cause rendering issues`);
    }

    return {
      success: true,
      props: { tournamentId, tournamentType, isOrganizer }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      props: null
    };
  }
}

testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}:`);

  const result = simulateTournamentBracketProps(scenario.tournament);

  if (result.success) {
    console.log(`   ✅ SUCCESS: Props would be passed correctly`);
  } else {
    console.log(`   ❌ ERROR: ${result.error}`);
  }

  console.log();
});

console.log("🔧 Potential Error Sources:");
console.log("-".repeat(50));
console.log("1. Database query failures could return incomplete tournament objects");
console.log("2. Network issues might cause tournament data to be partially loaded");
console.log("3. Race conditions between data loading and component rendering");
console.log("4. Fallback data creation might miss required properties");
console.log();

console.log("🎯 Most Likely Issues:");
console.log("-".repeat(50));
console.log("- If tournament.id is undefined/null: fetchMatches() fails in TournamentBracket");
console.log("- If tournament.tournament_type is undefined: could cause bracket rendering issues");
console.log("- React strict mode might expose timing issues with prop updates");
console.log("- The error at line 462 suggests the component renders but fails during interaction");
console.log();

console.log("💡 Recommended Fixes:");
console.log("-".repeat(50));
console.log("1. Add prop validation in TournamentBracket component");
console.log("2. Handle undefined/null tournamentId gracefully in fetchMatches()");
console.log("3. Provide default values for missing tournament properties");
console.log("4. Add loading states to prevent rendering with incomplete data");
