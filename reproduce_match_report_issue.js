#!/usr/bin/env node

/**
 * Script to reproduce the match result reporting issue
 * Testing the submission flow from form to database
 */

console.log("=== Reproducing Match Result Reporting Issue ===");

// Mock fetch function to simulate API calls
function mockFetch(url, options) {
  console.log(`\nMock API Call: ${options?.method || 'GET'} ${url}`);

  if (options?.body) {
    console.log("Request Body:", JSON.parse(options.body));
  }

  // Simulate potential issues
  const commonIssues = [
    {
      type: "Network Error",
      condition: () => Math.random() < 0.1,
      response: () => Promise.reject(new Error("Network request failed"))
    },
    {
      type: "Database Schema Issue",
      condition: () => url.includes("/report-result") && Math.random() < 0.3,
      response: () => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({
          error: "Failed to save match result",
          details: "relation 'match_results' does not exist"
        })
      })
    },
    {
      type: "Authentication Error",
      condition: () => Math.random() < 0.2,
      response: () => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Unauthorized" })
      })
    },
    {
      type: "Success Case",
      condition: () => true,
      response: () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: "Match result reported and tournament progressed"
        })
      })
    }
  ];

  // Find first matching issue
  const issue = commonIssues.find(issue => issue.condition());
  console.log(`Simulating: ${issue.type}`);

  return issue.response();
}

// Simulate the handleReportResult function from tournament-bracket.jsx
async function simulateHandleReportResult(matchData, resultForm) {
  console.log("\n=== Simulating Match Result Submission ===");
  console.log("Match Data:", matchData);
  console.log("Result Form:", resultForm);

  try {
    const response = await mockFetch(`/api/tournaments/matches/${matchData.id}/report-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resultForm)
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ SUCCESS:", result.message);
      return { success: true, message: result.message };
    } else {
      console.log("❌ ERROR:", result.error);
      if (result.details) {
        console.log("Error Details:", result.details);
      }
      return { success: false, error: result.error, details: result.details };
    }
  } catch (error) {
    console.log("❌ NETWORK/FETCH ERROR:", error.message);
    return { success: false, error: error.message, type: 'network' };
  }
}

// Test different scenarios
async function runTests() {
  const testScenarios = [
    {
      name: "Valid Match Report",
      matchData: { id: "match_123", player1_id: "user1", player2_id: "user2" },
      resultForm: {
        winner_id: "user1",
        player1_score: 5,
        player2_score: 2,
        screenshot_url: "https://example.com/screenshot.jpg",
        notes: "Great match!"
      }
    },
    {
      name: "Missing Winner",
      matchData: { id: "match_456", player1_id: "user1", player2_id: "user2" },
      resultForm: {
        winner_id: "",
        player1_score: 3,
        player2_score: 1,
        screenshot_url: "",
        notes: ""
      }
    },
    {
      name: "Invalid Scores",
      matchData: { id: "match_789", player1_id: "user1", player2_id: "user2" },
      resultForm: {
        winner_id: "user1",
        player1_score: -1,
        player2_score: "invalid",
        screenshot_url: "",
        notes: ""
      }
    }
  ];

  console.log("\n=== Running Test Scenarios ===");

  for (const scenario of testScenarios) {
    console.log(`\n--- Testing: ${scenario.name} ---`);

    const result = await simulateHandleReportResult(scenario.matchData, scenario.resultForm);

    if (result.success) {
      console.log(`✅ ${scenario.name}: PASSED`);
    } else {
      console.log(`❌ ${scenario.name}: FAILED - ${result.error}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    }
  }
}

// Check for potential frontend validation issues
function checkFormValidation() {
  console.log("\n=== Checking Form Validation Issues ===");

  const potentialIssues = [
    {
      check: "Winner Selection Required",
      test: (form) => !form.winner_id,
      message: "Form should be disabled when no winner is selected"
    },
    {
      check: "Score Validation",
      test: (form) => form.player1_score < 0 || form.player2_score < 0,
      message: "Negative scores should not be allowed"
    },
    {
      check: "URL Validation",
      test: (form) => form.screenshot_url && !form.screenshot_url.startsWith('http'),
      message: "Invalid URL format for screenshot"
    }
  ];

  const testForm = {
    winner_id: "",
    player1_score: 5,
    player2_score: 2,
    screenshot_url: "invalid-url",
    notes: ""
  };

  potentialIssues.forEach(issue => {
    if (issue.test(testForm)) {
      console.log(`⚠️  ${issue.check}: ${issue.message}`);
    } else {
      console.log(`✅ ${issue.check}: OK`);
    }
  });
}

// Run all tests
async function main() {
  await runTests();
  checkFormValidation();

  console.log("\n=== Common Issues That Could Prevent Submission ===");
  console.log("1. Database schema issues (match_results table missing)");
  console.log("2. Authentication problems (user not logged in)");
  console.log("3. Permission issues (user not participant or organizer)");
  console.log("4. Network connectivity problems");
  console.log("5. Form validation preventing submission");
  console.log("6. JavaScript errors in the frontend");

  console.log("\n=== Next Steps ===");
  console.log("• Check browser console for JavaScript errors");
  console.log("• Verify database schema has match_results table");
  console.log("• Test with actual user authentication");
  console.log("• Check network tab for failed requests");
}

main().catch(console.error);
