#!/usr/bin/env node

/**
 * Script to reproduce the TournamentBracket error
 * This simulates the prop chain: TournamentPage -> TournamentDetails -> TournamentBracket
 */

console.log("🔍 Reproducing TournamentBracket Error");
console.log("=".repeat(50));

// Simulate the fallback tournament data structure from TournamentPage
function getFallbackTournament(id) {
  const fallbackTournaments = [
    {
      id: "1",
      title: "eFootball 2026 Championship",
      name: "eFootball 2026 Championship",
      description: "Join the ultimate eFootball tournament!",
      game: "eFootball 2026",
      max_participants: 32,
      current_participants: 24,
      status: "upcoming",
      tournament_type: "single_elimination", // This is crucial for TournamentBracket
      start_date: "2025-01-15T10:00:00Z",
      end_date: "2025-01-20T18:00:00Z",
      prize_pool: "TZS 50,000",
      entry_fee: "TZS 5,000",
      organizer_id: "11111111-1111-1111-1111-111111111111",
      created_at: "2025-01-01T00:00:00Z",
    }
  ];

  const exactMatch = fallbackTournaments.find((t) => t.id === id);
  if (exactMatch) {
    return exactMatch;
  }

  // This is where the bug likely occurs - when creating a default tournament
  const defaultTournament = { ...fallbackTournaments[0] };
  defaultTournament.id = id;
  defaultTournament.title = `Tournament #${id}`;
  defaultTournament.description = `Sample tournament data for tournament ID ${id}`;

  return defaultTournament;
}

// Test different scenarios
console.log("📋 Testing Tournament Data Scenarios:");
console.log("-".repeat(50));

// Scenario 1: Valid tournament with all props
console.log("1. Valid tournament data:");
const validTournament = getFallbackTournament("1");
console.log(`   ID: ${validTournament.id}`);
console.log(`   Type: ${validTournament.tournament_type}`);
console.log(`   Title: ${validTournament.title}`);
console.log(`   ✅ Should work fine`);
console.log();

// Scenario 2: Unknown tournament ID (triggers fallback logic)
console.log("2. Unknown tournament ID (999):");
const unknownTournament = getFallbackTournament("999");
console.log(`   ID: ${unknownTournament.id}`);
console.log(`   Type: ${unknownTournament.tournament_type}`);
console.log(`   Title: ${unknownTournament.title}`);
console.log(`   ✅ Should work fine (inherits tournament_type from fallback)`);
console.log();

// Scenario 3: What if tournament_type is missing?
console.log("3. Tournament with missing tournament_type:");
const brokenTournament = { ...validTournament };
delete brokenTournament.tournament_type;
console.log(`   ID: ${brokenTournament.id}`);
console.log(`   Type: ${brokenTournament.tournament_type}`);
console.log(`   ❌ This could cause the error in TournamentBracket`);
console.log();

// Scenario 4: What if ID is missing?
console.log("4. Tournament with missing ID:");
const noIdTournament = { ...validTournament };
delete noIdTournament.id;
console.log(`   ID: ${noIdTournament.id}`);
console.log(`   Type: ${noIdTournament.tournament_type}`);
console.log(`   ❌ This would definitely cause the error in TournamentBracket`);
console.log();

// Let's check what TournamentBracket expects
console.log("🔧 TournamentBracket Expected Props:");
console.log("-".repeat(50));
console.log("From TournamentDetails line 167-171:");
console.log("  - tournamentId: tournament.id");
console.log("  - tournamentType: tournament.tournament_type");
console.log("  - isOrganizer: boolean");
console.log();

// Simulate the error condition
console.log("⚠️  Potential Error Scenarios:");
console.log("-".repeat(50));
console.log("1. If tournament.id is undefined:");
console.log("   - TournamentBracket receives tournamentId={undefined}");
console.log("   - fetchMatches() fails with 'Tournament ID is required'");
console.log("   - Could cause rendering errors");
console.log();

console.log("2. If tournament.tournament_type is undefined:");
console.log("   - TournamentBracket receives tournamentType={undefined}");
console.log("   - Could cause issues in bracket rendering logic");
console.log();

console.log("3. Database connection issues:");
console.log("   - If database queries fail, tournament might be incomplete");
console.log("   - Missing required properties could cause React rendering errors");
console.log();

console.log("🎯 Most Likely Root Cause:");
console.log("-".repeat(50));
console.log("The error at line 462 in TournamentBracket (Cancel button) suggests:");
console.log("- The component is rendering successfully up to that point");
console.log("- The error might be in event handlers or state updates");
console.log("- Likely related to undefined user or selectedMatch state");
console.log("- The 'user' or 'authLoading' variables might be undefined");

console.log();
console.log("🔍 Need to check:");
console.log("- Line 462: Button component with onClick handler");
console.log("- Line 467: disabled prop uses !user || authLoading");
console.log("- If user is undefined when expected to be null, it could cause issues");
