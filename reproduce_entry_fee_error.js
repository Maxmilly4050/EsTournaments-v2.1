#!/usr/bin/env node

/**
 * Script to reproduce the Supabase query error:
 * "column tournaments.entry_fee does not exist"
 * This error occurs when trying to select an "entry_fee" column that doesn't exist in the database
 */

console.log("=== Reproducing Supabase Entry Fee Column Error ===");

// Mock the createClient function since we can't actually connect to Supabase in this test
function createMockSupabaseClient() {
  return {
    from: (table) => ({
      select: (columns) => {
        console.log(`Mock Supabase Query: SELECT ${columns} FROM ${table}`);

        // Check if "entry_fee" column is being selected
        if (columns.includes('entry_fee')) {
          console.log("❌ ERROR: Attempting to select 'entry_fee' column");
          return {
            error: {
              code: "42703",
              details: null,
              hint: null,
              message: "column tournaments.entry_fee does not exist"
            },
            data: null
          };
        }

        // If no "entry_fee" column, simulate successful query
        console.log("✅ Query would succeed (no 'entry_fee' column selected)");
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
              created_at: new Date().toISOString(),
              created_by: "user123"
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

  // This is the current query from tournament-section.jsx lines 67-81 with entry_fee
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
  console.log("\n2. Testing FIXED query (with entry_fee_amount and entry_fee_currency):");

  const supabase = createMockSupabaseClient();

  // Fixed query - use entry_fee_amount and entry_fee_currency instead of entry_fee
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

  console.log("Fixed query result:", query);

  if (query.error) {
    console.log("❌ Fixed query still has errors:", query.error);
    return false;
  }

  console.log("✅ Fixed query succeeds");
  console.log("✅ Can access entry fee data via entry_fee_amount and entry_fee_currency");
  return true;
}

async function runTests() {
  const originalQueryWorks = await testTournamentSectionQuery();
  const fixedQueryWorks = await testFixedQuery();

  console.log("\n=== Analysis ===");
  console.log("The error occurs because:");
  console.log("1. tournament-section.jsx tries to SELECT 'entry_fee' column");
  console.log("2. The 'entry_fee' column doesn't exist in the tournaments table");
  console.log("3. The correct columns are 'entry_fee_amount' and 'entry_fee_currency'");

  console.log("\n=== Solution ===");
  console.log("Replace 'entry_fee' with 'entry_fee_amount, entry_fee_currency' in the SELECT query");
  console.log("The component already uses entry_fee_amount and entry_fee_currency for display");

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
