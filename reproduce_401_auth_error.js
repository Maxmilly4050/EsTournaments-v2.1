#!/usr/bin/env node

/**
 * Script to reproduce the 401 Unauthorized error when submitting match results
 * This helps identify authentication issues in the API route
 */

console.log("=== Reproducing 401 Unauthorized Error ===");

// Simulate the authentication flow that happens in the API route
function simulateAuthFlow() {
  console.log("\n1. Testing different authentication scenarios:");

  const authScenarios = [
    {
      name: "No Auth Token",
      cookies: {},
      expectedResult: "401 Unauthorized"
    },
    {
      name: "Invalid Auth Token",
      cookies: { "sb-access-token": "invalid_token_123" },
      expectedResult: "401 Unauthorized"
    },
    {
      name: "Expired Auth Token",
      cookies: { "sb-access-token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImV4cCI6MTUxNjIzOTAyMn0.invalid" },
      expectedResult: "401 Unauthorized"
    },
    {
      name: "Valid Auth Token",
      cookies: { "sb-access-token": "valid_token_user_authenticated" },
      expectedResult: "Should proceed to permission check"
    }
  ];

  authScenarios.forEach((scenario, index) => {
    console.log(`\n  Scenario ${index + 1}: ${scenario.name}`);
    console.log(`    Cookies: ${JSON.stringify(scenario.cookies)}`);

    // Simulate supabase.auth.getUser() behavior
    if (Object.keys(scenario.cookies).length === 0) {
      console.log(`    ❌ supabase.auth.getUser() returns: { data: { user: null }, error: null }`);
      console.log(`    ❌ API Response: 401 Unauthorized - No authentication cookie`);
    } else if (scenario.cookies["sb-access-token"] === "invalid_token_123") {
      console.log(`    ❌ supabase.auth.getUser() returns: { data: { user: null }, error: "Invalid JWT" }`);
      console.log(`    ❌ API Response: 401 Unauthorized - Invalid token`);
    } else if (scenario.cookies["sb-access-token"].includes("invalid")) {
      console.log(`    ❌ supabase.auth.getUser() returns: { data: { user: null }, error: "Token expired" }`);
      console.log(`    ❌ API Response: 401 Unauthorized - Token expired`);
    } else {
      console.log(`    ✅ supabase.auth.getUser() returns: { data: { user: { id: "user123" } }, error: null }`);
      console.log(`    ✅ Proceeds to match permission validation`);
    }
  });
}

// Test the client-side authentication setup
function testClientSideAuth() {
  console.log("\n2. Testing Client-Side Authentication Issues:");

  const clientIssues = [
    {
      issue: "User not logged in",
      description: "User session expired or never logged in",
      solution: "Redirect to login page or refresh session"
    },
    {
      issue: "Session not persisted",
      description: "Authentication cookies not being sent with requests",
      solution: "Check cookie settings and domain configuration"
    },
    {
      issue: "CORS/Domain mismatch",
      description: "Cookies not sent due to domain/port differences",
      solution: "Ensure Supabase URL matches request origin"
    },
    {
      issue: "Browser security policies",
      description: "Third-party cookies blocked or SameSite issues",
      solution: "Configure cookie settings properly"
    }
  ];

  clientIssues.forEach((issue, index) => {
    console.log(`\n  Issue ${index + 1}: ${issue.issue}`);
    console.log(`    Description: ${issue.description}`);
    console.log(`    Solution: ${issue.solution}`);
  });
}

// Test server-side authentication setup
function testServerSideAuth() {
  console.log("\n3. Testing Server-Side Authentication Configuration:");

  console.log("\nChecking createServerComponentClient setup:");
  console.log("✅ Using: createServerComponentClient({ cookies })");
  console.log("✅ Import: from '@supabase/auth-helpers-nextjs'");
  console.log("✅ Import: cookies from 'next/headers'");

  console.log("\nPotential server-side issues:");
  console.log("• Supabase environment variables not set");
  console.log("• Incorrect Supabase URL or anon key");
  console.log("• Cookie parsing issues in Next.js");
  console.log("• Middleware interfering with authentication");
}

// Simulate the exact API call that's failing
function simulateFailingApiCall() {
  console.log("\n4. Simulating the Failing API Call:");

  const apiRequest = {
    method: "POST",
    url: "http://localhost:3000/api/tournaments/matches/4/report-result",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      winner_id: "user123",
      player1_score: 5,
      player2_score: 2,
      screenshot_url: "",
      notes: "Test match result"
    }
  };

  console.log("Request Details:");
  console.log(JSON.stringify(apiRequest, null, 2));

  console.log("\nMost likely causes of 401:");
  console.log("1. ❌ User not authenticated (no session)");
  console.log("2. ❌ Authentication cookies not being sent");
  console.log("3. ❌ Server can't validate the session token");
  console.log("4. ❌ Supabase configuration issues");
}

// Run all tests
function main() {
  simulateAuthFlow();
  testClientSideAuth();
  testServerSideAuth();
  simulateFailingApiCall();

  console.log("\n=== Debugging Steps ===");
  console.log("1. Check browser dev tools for authentication cookies");
  console.log("2. Verify user is logged in before submitting");
  console.log("3. Check Supabase environment variables");
  console.log("4. Test authentication in other parts of the app");
  console.log("5. Add logging to the API route to see exact auth error");

  console.log("\n=== Quick Fix Suggestions ===");
  console.log("• Add more detailed error logging in the API route");
  console.log("• Check if user session is valid before making the request");
  console.log("• Ensure proper authentication flow in the frontend");
  console.log("• Verify Supabase client configuration");
}

main();
