// Script to reproduce the line 78:33 error in fetchTournaments function
console.log('🔍 Reproducing Line 78:33 Error in fetchTournaments');
console.log('====================================================');

console.log('\n1. Analyzing Line 78:33 in tournament-section.jsx:');
console.log('==================================================');
console.log('Location: components/tournament-section.jsx line 78:33');
console.log('Code context:');
console.log('  Line 76: } else if (status) {');
console.log('  Line 77:   query = query.eq("status", status)');
console.log('  Line 78: }');
console.log('');
console.log('The error at 78:33 suggests the issue is in the query chaining logic.');

console.log('\n2. Potential Error Scenarios:');
console.log('=============================');

console.log('🔍 Query Object Issues:');
console.log('- query object becomes null/undefined during chaining');
console.log('- Supabase client not properly initialized');
console.log('- Method chaining fails on corrupted query object');
console.log('- Multiple simultaneous query modifications causing conflicts');

console.log('\n🔍 Parameter Issues:');
console.log('- status parameter has unexpected value type');
console.log('- status parameter is an object instead of string');
console.log('- status parameter contains special characters causing SQL issues');

console.log('\n🔍 Timing Issues:');
console.log('- Component unmounted during query execution');
console.log('- Async race conditions with multiple fetchTournaments calls');
console.log('- Supabase connection lost during query building');

console.log('\n3. Testing Query Building Logic:');
console.log('================================');

// Simulate the query building process
function testQueryBuilding(status, now = new Date().toISOString()) {
  console.log(`\nTesting query building with status: "${status}"`);

  try {
    // Simulate Supabase query object
    const mockQuery = {
      gt: function(field, value) {
        console.log(`  - Applied gt("${field}", "${value}")`);
        return this;
      },
      eq: function(field, value) {
        console.log(`  - Applied eq("${field}", "${value}")`);
        return this;
      },
      order: function(field, options) {
        console.log(`  - Applied order("${field}", ${JSON.stringify(options)})`);
        return this;
      },
      limit: function(count) {
        console.log(`  - Applied limit(${count})`);
        return this;
      }
    };

    let query = mockQuery;

    // Simulate the exact logic from line 72-78
    if (status === "upcoming") {
      query = query.gt("start_date", now).eq("status", "upcoming");
    } else if (status === "ongoing") {
      query = query.eq("status", "ongoing");
    } else if (status) {
      query = query.eq("status", status); // This is line 77 - potential error source
    }

    console.log(`✅ Query building succeeded for status: "${status}"`);
    return { success: true, query };

  } catch (error) {
    console.log(`❌ Query building failed for status: "${status}" - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test various status values
const statusTestCases = [
  "upcoming",
  "ongoing",
  "completed",
  "",
  null,
  undefined,
  123,
  { invalid: "object" },
  [],
  true,
  false
];

console.log('\n4. Testing Different Status Values:');
console.log('===================================');

statusTestCases.forEach((statusValue, index) => {
  console.log(`\n--- Test ${index + 1}: ${JSON.stringify(statusValue)} ---`);
  testQueryBuilding(statusValue);
});

console.log('\n5. Testing Supabase Client Issues:');
console.log('==================================');

// Simulate different Supabase client states
const clientTestScenarios = [
  {
    name: "Null Supabase client",
    createClient: () => null
  },
  {
    name: "Undefined from() method",
    createClient: () => ({ from: undefined })
  },
  {
    name: "Null from() result",
    createClient: () => ({ from: () => null })
  },
  {
    name: "Broken select() method",
    createClient: () => ({
      from: () => ({
        select: () => null
      })
    })
  }
];

clientTestScenarios.forEach((scenario, index) => {
  console.log(`\nTesting scenario ${index + 1}: ${scenario.name}`);
  try {
    const client = scenario.createClient();
    if (!client) {
      console.log('❌ Client is null - would cause error');
    } else if (!client.from) {
      console.log('❌ from() method missing - would cause error');
    } else {
      const queryBuilder = client.from("tournaments");
      if (!queryBuilder) {
        console.log('❌ from() returns null - would cause error');
      } else if (!queryBuilder.select) {
        console.log('❌ select() method missing - would cause error');
      } else {
        console.log('✅ Basic query building would work');
      }
    }
  } catch (error) {
    console.log(`❌ Error in client test: ${error.message}`);
  }
});

console.log('\n💡 ROOT CAUSE ANALYSIS:');
console.log('=======================');
console.log('The error at line 78:33 could be caused by:');
console.log('1. Query object becoming null/undefined during conditional chaining');
console.log('2. Supabase client connection issues during query building');
console.log('3. Invalid status parameter causing .eq() method to fail');
console.log('4. Race condition where component unmounts during query execution');
console.log('5. Multiple rapid fetchTournaments calls interfering with each other');

console.log('\n🔧 POTENTIAL SOLUTIONS:');
console.log('=======================');
console.log('1. Add null checks for query object before chaining methods');
console.log('2. Add parameter validation for status before using in .eq()');
console.log('3. Add try-catch around query building logic specifically');
console.log('4. Add abort controller for query cancellation on unmount');
console.log('5. Add debouncing to prevent rapid successive calls');

console.log('\nNext: Implement fixes for the identified issues');
