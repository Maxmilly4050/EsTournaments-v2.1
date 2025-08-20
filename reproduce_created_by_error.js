#!/usr/bin/env node

/**
 * Script to reproduce the Supabase query error:
 * "column tournaments.created_by does not exist"
 * This error occurs when trying to select a "created_by" column that doesn't exist in the database
 */

console.log("=== Reproducing Supabase Created By Column Error ===");

// Mock the createClient function since we can't actually connect to Supabase in this test
function createMockSupabaseClient() {
  return {
    from: (table) => ({
      select: (columns) => {
        console.log(`Mock Supabase Query: SELECT ${columns} FROM ${table}`);

        // Check if "created_by" column is being selected
        if (columns.includes('created_by')) {
          console.log("❌ ERROR: Attempting to select 'created_by' column");
          return {
            error: {
              code: "42703",
              details: null,
              hint: 'Perhaps you meant to reference the column "tournaments.created_at".',
              message: "column tournaments.created_by does not exist"
            },
            data: null
          };
        }

        // If no "created_by" column, simulate successful query
        console.log("✅ Query would succeed (no 'created_by' column selected)");
        return {
          error: null,
          data: [
            {
              id: "1",
              description: "eFootball 2026 Championship",
              game: "eFootball 2026",
              max_participants: 32,
              current_participants: 24,
              status: "upcoming",
              start_date: new Date().toISOString(),
              end_date: null,
              prize_pool: "75,000 TZS",
              entry_fee_amount: "5,000",
              entry_fee_currency: "TZS",
              created_at: new Date().toISOString()
            }
          ]
        };
      },
      order: (field, options) => ({
        limit: (num) => ({
          gt: (field, value) => ({
            eq: (field, value) => ({
              error: null,
              data: []
            })
          })
        })
      })
    })
  };
}

async function testTournamentSectionQuery() {
  console.log("\n1. Testing tournament-section.jsx query pattern:");

  const supabase = createMockSupabaseClient();

  // This is the current query from tournament-section.jsx lines 67-81 with created_by
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
    entry_fee_amount,
    entry_fee_currency,
    created_at,
    created_by
  `);

  console.log("Query result:", query);

  if (query.error) {
    console.log("❌ ERROR REPRODUCED:");
    console.log("Code:", query.error.code);
    console.log("Message:", query.error.message);
    console.log("Details:", query.error.details);
    console.log("Hint:", query.error.hint);
    return false;
  }

  return true;
}

async function testFixedQuery() {
  console.log("\n2. Testing FIXED query (without 'created_by' column):");

  const supabase = createMockSupabaseClient();

  // Fixed query - remove created_by column since it doesn't exist
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
    entry_fee_amount,
    entry_fee_currency,
    created_at
  `);

  console.log("Fixed query result:", query);

  if (query.error) {
    console.log("❌ Fixed query still has errors:", query.error);
    return false;
  }

  console.log("✅ Fixed query succeeds");
  console.log("✅ Can access tournament data without created_by column");
  return true;
}

async function runTests() {
  const originalQueryWorks = await testTournamentSectionQuery();
  const fixedQueryWorks = await testFixedQuery();

  console.log("\n=== Analysis ===");
  console.log("The error occurs because:");
  console.log("1. tournament-section.jsx tries to SELECT 'created_by' column");
  console.log("2. The 'created_by' column doesn't exist in the tournaments table");
  console.log("3. The database suggests using 'created_at' column instead");
  console.log("4. The component uses created_by on line 129 for filtering tournaments");

  console.log("\n=== Solution ===");
  console.log("Remove 'created_by' from the SELECT query in tournament-section.jsx");
  console.log("Update the filtering logic to not depend on created_by field");
  console.log("The component can use other fields for validation or remove the filter");

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
