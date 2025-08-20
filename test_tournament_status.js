#!/usr/bin/env node

/**
 * Test script to reproduce tournament status issues
 * Current date: 2025-08-20 17:20
 */

console.log("=== Tournament Status Test ===");
console.log("Current date: 2025-08-20 17:20");
console.log("");

// Test current behavior with mock tournament data
const currentTime = new Date("2025-08-20T17:20:00Z");

const mockTournaments = [
  {
    id: 1,
    name: "Test Tournament 1",
    start_date: "2025-08-17T07:20:00Z", // Started 3 days ago
    end_date: null, // No end date set
    status: "ongoing"
  },
  {
    id: 2,
    name: "Test Tournament 2",
    start_date: "2025-08-25T07:20:00Z", // Starts in 5 days
    end_date: "2025-08-30T07:20:00Z", // Ends in 10 days
    status: "upcoming"
  },
  {
    id: 3,
    name: "Test Tournament 3",
    start_date: "2025-08-15T07:20:00Z", // Started 5 days ago
    end_date: "2025-08-19T07:20:00Z", // Ended yesterday
    status: "ongoing" // Should be completed but still shows as ongoing
  }
];

function formatDate(dateString) {
  if (!dateString) return "TBD";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCorrectStatus(tournament, now) {
  const startDate = new Date(tournament.start_date);
  const endDate = tournament.end_date ? new Date(tournament.end_date) : null;

  if (endDate && now > endDate) {
    return "completed";
  } else if (now >= startDate) {
    return "ongoing";
  } else {
    return "upcoming";
  }
}

function testTournamentStatus() {
  console.log("Testing tournament status logic:");
  console.log("=====================================");

  mockTournaments.forEach(tournament => {
    const currentStatus = tournament.status;
    const correctStatus = getCorrectStatus(tournament, currentTime);
    const statusMismatch = currentStatus !== correctStatus;

    console.log(`\nTournament: ${tournament.name}`);
    console.log(`Start Date: ${formatDate(tournament.start_date)}`);
    console.log(`End Date: ${formatDate(tournament.end_date)}`);
    console.log(`Current Status: ${currentStatus}`);
    console.log(`Correct Status: ${correctStatus}`);
    console.log(`Status Mismatch: ${statusMismatch ? '❌ YES' : '✅ NO'}`);

    if (statusMismatch) {
      console.log(`🔧 ISSUE: Tournament should be "${correctStatus}" but shows as "${currentStatus}"`);
    }
  });
}

function testTournamentFiltering() {
  console.log("\n\nTesting tournament filtering:");
  console.log("============================");

  const upcomingTournaments = mockTournaments.filter(t => {
    // Current logic: filter by start_date > now AND status = "upcoming"
    const startDate = new Date(t.start_date);
    return startDate > currentTime && t.status === "upcoming";
  });

  const ongoingTournaments = mockTournaments.filter(t => {
    // Current logic: filter by status = "ongoing" only
    return t.status === "ongoing";
  });

  console.log("\nCurrent Filtering Results:");
  console.log(`Upcoming tournaments: ${upcomingTournaments.length}`);
  upcomingTournaments.forEach(t => console.log(`  - ${t.name}`));

  console.log(`Ongoing tournaments: ${ongoingTournaments.length}`);
  ongoingTournaments.forEach(t => console.log(`  - ${t.name}`));

  // Test correct filtering
  const correctUpcoming = mockTournaments.filter(t => getCorrectStatus(t, currentTime) === "upcoming");
  const correctOngoing = mockTournaments.filter(t => getCorrectStatus(t, currentTime) === "ongoing");
  const correctCompleted = mockTournaments.filter(t => getCorrectStatus(t, currentTime) === "completed");

  console.log("\nCorrect Filtering Results:");
  console.log(`Upcoming tournaments: ${correctUpcoming.length}`);
  correctUpcoming.forEach(t => console.log(`  - ${t.name}`));

  console.log(`Ongoing tournaments: ${correctOngoing.length}`);
  correctOngoing.forEach(t => console.log(`  - ${t.name}`));

  console.log(`Completed tournaments: ${correctCompleted.length}`);
  correctCompleted.forEach(t => console.log(`  - ${t.name}`));
}

function identifyIssues() {
  console.log("\n\nIdentified Issues:");
  console.log("==================");
  console.log("1. ❌ End dates showing as 'TBD' instead of actual dates");
  console.log("2. ❌ Tournament status not updated based on end_date");
  console.log("3. ❌ Tournaments past their end_date still showing in 'ongoing' section");
  console.log("4. ❌ No automatic status transitions based on start/end dates");
  console.log("5. ❌ Database query in tournament-section.jsx doesn't include end_date field");

  console.log("\nRequired Fixes:");
  console.log("===============");
  console.log("1. ✅ Add end_date to database queries");
  console.log("2. ✅ Implement status calculation logic based on current time vs start/end dates");
  console.log("3. ✅ Update tournament filtering to use calculated status");
  console.log("4. ✅ Ensure tournament details shows actual end_date instead of 'TBD'");
}

// Run tests
testTournamentStatus();
testTournamentFiltering();
identifyIssues();
