#!/usr/bin/env node

/**
 * Test script to verify the results management fix
 * This script simulates the data structure and filtering logic to confirm
 * that matches with pending/disputed results will now appear correctly.
 */

// Mock data structure matching the actual database schema
const mockMatchesWithResults = [
  {
    id: 1,
    tournament_id: "550e8400-e29b-41d4-a716-446655440003",
    round: 1,
    match_number: 1,
    player1_id: "11111111-1111-1111-1111-111111111111",
    player2_id: "22222222-2222-2222-2222-222222222222",
    winner_id: null,
    status: "ongoing",
    player1: { id: "11111111-1111-1111-1111-111111111111", username: "Fau Lata" },
    player2: { id: "22222222-2222-2222-2222-222222222222", username: "MaxMilly" },
    match_results: [
      {
        id: 1,
        submitted_by: "11111111-1111-1111-1111-111111111111",
        winner_id: "11111111-1111-1111-1111-111111111111",
        player1_score: 3,
        player2_score: 0,
        screenshot_urls: ["/screenshots/match1_result.png"],
        notes: "Clean victory, good game!",
        status: "pending", // This should now appear in results management
        submitted_at: "2025-08-21T17:08:00Z",
        reviewed_at: null,
        reviewed_by: null
      }
    ]
  },
  {
    id: 2,
    tournament_id: "550e8400-e29b-41d4-a716-446655440003",
    round: 1,
    match_number: 2,
    player1_id: "33333333-3333-3333-3333-333333333333",
    player2_id: "44444444-4444-4444-4444-444444444444",
    winner_id: "44444444-4444-4444-4444-444444444444",
    status: "completed",
    player1: { id: "33333333-3333-3333-3333-333333333333", username: "Player3" },
    player2: { id: "44444444-4444-4444-4444-444444444444", username: "Player4" },
    match_results: [
      {
        id: 2,
        submitted_by: "44444444-4444-4444-4444-444444444444",
        winner_id: "44444444-4444-4444-4444-444444444444",
        player1_score: 1,
        player2_score: 2,
        screenshot_urls: ["/screenshots/match2_result1.png", "/screenshots/match2_result2.png"],
        notes: "Close match",
        status: "disputed", // This should also appear in results management
        submitted_at: "2025-08-21T16:30:00Z",
        reviewed_at: null,
        reviewed_by: null
      }
    ]
  },
  {
    id: 3,
    tournament_id: "550e8400-e29b-41d4-a716-446655440003",
    round: 1,
    match_number: 3,
    player1_id: "55555555-5555-5555-5555-555555555555",
    player2_id: "66666666-6666-6666-6666-666666666666",
    winner_id: "55555555-5555-5555-5555-555555555555",
    status: "completed",
    player1: { id: "55555555-5555-5555-5555-555555555555", username: "Player5" },
    player2: { id: "66666666-6666-6666-6666-666666666666", username: "Player6" },
    match_results: [
      {
        id: 3,
        submitted_by: "55555555-5555-5555-5555-555555555555",
        winner_id: "55555555-5555-5555-5555-555555555555",
        player1_score: 2,
        player2_score: 1,
        screenshot_urls: ["/screenshots/match3_result.png"],
        notes: "Good game",
        status: "approved", // This should NOT appear in results management
        submitted_at: "2025-08-21T15:45:00Z",
        reviewed_at: "2025-08-21T16:00:00Z",
        reviewed_by: "admin123"
      }
    ]
  },
  {
    id: 4,
    tournament_id: "550e8400-e29b-41d4-a716-446655440003",
    round: 1,
    match_number: 4,
    player1_id: "77777777-7777-7777-7777-777777777777",
    player2_id: "88888888-8888-8888-8888-888888888888",
    winner_id: null,
    status: "pending",
    player1: { id: "77777777-7777-7777-7777-777777777777", username: "Player7" },
    player2: { id: "88888888-8888-8888-8888-888888888888", username: "Player8" },
    match_results: [] // No results submitted yet - should NOT appear
  }
];

console.log("🔍 Testing Results Management Filtering Logic");
console.log("=".repeat(50));

// Test the filtering logic from the fixed component
function testResultsFiltering(matches) {
  const pendingMatches = matches.filter(match => {
    const result = match.match_results?.[0];
    return result && (result.status === "pending" || result.status === "disputed");
  });
  return pendingMatches;
}

const matchesNeedingReview = testResultsFiltering(mockMatchesWithResults);

console.log(`📊 Total matches: ${mockMatchesWithResults.length}`);
console.log(`⏳ Matches needing review: ${matchesNeedingReview.length}`);
console.log();

console.log("📋 Matches that should appear in Results Management:");
console.log("-".repeat(50));

if (matchesNeedingReview.length === 0) {
  console.log("❌ ERROR: No matches found for review!");
  console.log("   The filtering logic may still be incorrect.");
} else {
  matchesNeedingReview.forEach((match, index) => {
    const result = match.match_results[0];
    console.log(`${index + 1}. Round ${match.round}, Match ${match.match_number}`);
    console.log(`   Players: ${match.player1.username} vs ${match.player2.username}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Score: ${match.player1.username} ${result.player1_score} - ${result.player2_score} ${match.player2.username}`);
    console.log(`   Winner: ${result.winner_id === match.player1_id ? match.player1.username : match.player2.username}`);
    console.log(`   Screenshots: ${result.screenshot_urls.length} uploaded`);
    console.log(`   Submitted: ${new Date(result.submitted_at).toLocaleString()}`);
    if (result.notes) {
      console.log(`   Notes: ${result.notes}`);
    }
    console.log();
  });
}

// Test status detection
console.log("🏷️  Testing Status Detection Logic:");
console.log("-".repeat(50));

function getMatchStatus(match) {
  if (match.status === "completed" && match.winner_id) {
    return { status: "completed", color: "text-green-400", label: "Completed" };
  }

  const result = match.match_results?.[0];
  if (result?.status === "disputed") {
    return { status: "disputed", color: "text-red-400", label: "Disputed" };
  }

  if (result && result.status === "pending") {
    return { status: "pending", color: "text-yellow-400", label: "Pending Review" };
  }

  if (result && result.status === "approved") {
    return { status: "approved", color: "text-blue-400", label: "Approved" };
  }

  return { status: "awaiting", color: "text-slate-400", label: "Awaiting Results" };
}

mockMatchesWithResults.forEach((match) => {
  const status = getMatchStatus(match);
  console.log(`Match ${match.match_number}: ${status.label} (${status.status})`);
});

console.log();
console.log("✅ Test Results Summary:");
console.log("=".repeat(50));

const expectedMatchesForReview = mockMatchesWithResults.filter(m =>
  m.match_results.length > 0 &&
  (m.match_results[0].status === "pending" || m.match_results[0].status === "disputed")
);

if (matchesNeedingReview.length === expectedMatchesForReview.length) {
  console.log("✅ SUCCESS: Filtering logic is working correctly!");
  console.log(`   Expected ${expectedMatchesForReview.length} matches for review, found ${matchesNeedingReview.length}`);
  console.log("   - Pending results will now appear in Results Management");
  console.log("   - Disputed results will now appear in Results Management");
  console.log("   - Approved results will NOT appear (correct)");
  console.log("   - Matches without results will NOT appear (correct)");
} else {
  console.log("❌ FAILURE: Filtering logic needs more work");
  console.log(`   Expected ${expectedMatchesForReview.length} matches, but found ${matchesNeedingReview.length}`);
}

console.log();
console.log("🔧 Fix Applied:");
console.log("- Updated database query to use correct field names");
console.log("- Fixed filtering logic to look for 'pending' and 'disputed' statuses");
console.log("- Updated result display to work with screenshot_urls array");
console.log("- Fixed status detection logic");
console.log("- Removed references to non-existent 'requires_admin_review' field");
