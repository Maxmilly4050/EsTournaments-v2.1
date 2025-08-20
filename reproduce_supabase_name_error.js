#!/usr/bin/env node

/**
 * Script to reproduce the Supabase query error:
 * "column tournaments.name does not exist"
 * This error occurs when trying to select a "name" column that doesn't exist in the database
 */

console.log("=== Reproducing Supabase Name Column Error ===");

// Mock the createClient function since we can't actually connect to Supabase in this test
function createMockSupabaseClient() {
  return {
    from: (table) => ({
      select: (columns) => {
        console.log(`Mock Supabase Query: SELECT ${columns} FROM ${table}`);

        // Check if "name" column is being selected
        if (columns.includes('name')) {
          console.log("❌ ERROR: Attempting to select 'name' column");
          return {
            error: {
              code: "42703",
              details: null,
              hint: 'Perhaps you meant to reference the column "tournaments.game".',
              message: "column tournaments.name does not exist"
            },
            data: null
          };
        }

        // If no "name" column, simulate successful query
        console.log("✅ Query would succeed (no 'name' column selected)");
        return {
          error: null,
          data: [
            {
              id: "1",
              game: "eFootball 2026",
              description: "Test tournament",
              status: "upcoming"
            }
          ]
        };
      }
    })
  };
}

async function testTournamentSectionQuery() {
  console.log("\n1. Testing tournament-section.jsx query pattern:");

  const supabase = createMockSupabaseClient();

  // This is the exact query from tournament-section.jsx lines 67-81
  const query = supabase.from("tournaments").select(`
    id,
    name,
    description,
    game,
    max_participants,
    current_participants,
    status,
    start_date,
    end_date,
    prize_pool,
    entry_fee,
    created_at,
    created_by
  `);

  console.log("Query result:", query);

  if (query.error) {
    console.log("❌ ERROR REPRODUCED:");
    console.log("Code:", query.error.code);
    console.log("Message:", query.error.message);
    console.log("Hint:", query.error.hint);
    return false;
  }

  return true;
}

async function testFixedQuery() {
  console.log("\n2. Testing FIXED query (without 'name' column):");

  const supabase = createMockSupabaseClient();

  // Fixed query - remove "name" column since it doesn't exist
  const query = supabase.from("tournaments").select(`
    id,
    description,
    game,
    max_participants,
    current_participants,
    status,
    start_date,
    end_date,
    prize_pool,
    entry_fee,
    created_at,
    created_by
  `);

  console.log("Fixed query result:", query);

  if (query.error) {
    console.log("❌ Fixed query still has errors:", query.error);
    return false;
  }

  console.log("✅ Fixed query succeeds");
  return true;
}

async function runTests() {
  const originalQueryWorks = await testTournamentSectionQuery();
  const fixedQueryWorks = await testFixedQuery();

  console.log("\n=== Analysis ===");
  console.log("The error occurs because:");
  console.log("1. tournament-section.jsx tries to SELECT 'name' column");
  console.log("2. The 'name' column doesn't exist in the tournaments table");
  console.log("3. The database suggests using 'game' column instead");

  console.log("\n=== Solution ===");
  console.log("Remove the 'name' column from the SELECT query in tournament-section.jsx");
  console.log("The component can use the 'game' column or other available columns for display");

  return !originalQueryWorks && fixedQueryWorks;
}

// Run the test
runTests().then(success => {
  if (success) {
    console.log("\n✅ Error reproduction successful - fix identified");
  } else {
    console.log("\n❌ Error reproduction failed");
  }
});
