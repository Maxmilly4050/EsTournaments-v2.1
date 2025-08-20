// Script to reproduce the line 176:29 error in fetchTournaments function
console.log('🔍 Reproducing Line 176:29 Error in fetchTournaments');
console.log('====================================================');

console.log('\n1. Analyzing Line 176:29 in tournament-section.jsx:');
console.log('==================================================');
console.log('Location: components/tournament-section.jsx line 176:29');
console.log('Code context around line 176:');
console.log('  Line 174: }');
console.log('  Line 175: })');
console.log('  Line 176: '); // Empty line
console.log('  Line 177: console.log(`[v0] Final filtered tournaments: ${finalTournaments.length}`)');
console.log('');
console.log('Line 176 appears to be blank, but the error at 176:29 suggests there might be:');
console.log('- Hidden characters or whitespace causing issues');
console.log('- The error is actually on the previous line (175) but reported incorrectly');
console.log('- The error is in the array filtering operation that ends on line 175');

console.log('\n2. Analyzing the Array Filter Operation:');
console.log('=======================================');
console.log('The finalTournaments filtering logic spans lines 155-175:');
console.log('const finalTournaments = processedTournaments.filter(tournament => {');
console.log('  // filtering logic');
console.log('})  // This closing brace is on line 175');
console.log('');
console.log('Potential issues:');
console.log('- processedTournaments array is null/undefined');
console.log('- Individual tournament objects are malformed');
console.log('- calculated_status property access fails');
console.log('- Status comparison logic throws errors');

console.log('\n3. Testing Array Filter Operations:');
console.log('==================================');

// Test the filtering logic with various problematic data
function testTournamentFiltering() {
  console.log('\nTesting tournament filtering with various data scenarios:');

  const testCases = [
    {
      name: 'Valid tournaments',
      data: [
        { id: '1', calculated_status: 'upcoming' },
        { id: '2', calculated_status: 'ongoing' }
      ],
      status: 'upcoming'
    },
    {
      name: 'Null tournaments array',
      data: null,
      status: 'upcoming'
    },
    {
      name: 'Undefined tournaments array',
      data: undefined,
      status: 'ongoing'
    },
    {
      name: 'Tournaments with null calculated_status',
      data: [
        { id: '1', calculated_status: null },
        { id: '2', calculated_status: undefined }
      ],
      status: 'upcoming'
    },
    {
      name: 'Tournaments with missing properties',
      data: [
        null,
        undefined,
        { id: '1' }, // missing calculated_status
        { calculated_status: 'upcoming' } // missing id
      ],
      status: 'completed'
    },
    {
      name: 'Mixed valid and invalid tournaments',
      data: [
        { id: '1', calculated_status: 'upcoming' },
        null,
        { id: '2', calculated_status: 'ongoing' },
        { id: '3' }, // missing calculated_status
        { id: '4', calculated_status: 'completed' }
      ],
      status: 'upcoming'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n--- Test ${index + 1}: ${testCase.name} ---`);

    try {
      const { data, status } = testCase;

      // Simulate the exact filtering logic from the file
      if (!data || !Array.isArray(data)) {
        console.log('❌ Data is not a valid array, would cause error');
        return;
      }

      const filtered = data.filter(tournament => {
        try {
          if (!tournament || !tournament.calculated_status) {
            return false;
          }

          if (status === "upcoming") {
            return tournament.calculated_status === "upcoming";
          } else if (status === "ongoing") {
            return tournament.calculated_status === "ongoing";
          } else if (status === "completed") {
            return tournament.calculated_status === "completed";
          } else if (status) {
            return tournament.calculated_status === status;
          }
          return true;
        } catch (filterError) {
          console.log(`⚠️ Error filtering individual tournament: ${filterError.message}`);
          return false;
        }
      });

      console.log(`✅ Filtering succeeded: ${filtered.length} tournaments matched`);

    } catch (error) {
      console.log(`❌ Filtering failed: ${error.message}`);
    }
  });
}

testTournamentFiltering();

console.log('\n4. Testing Property Access Patterns:');
console.log('===================================');

// Test different ways properties might be accessed that could fail
function testPropertyAccess() {
  console.log('\nTesting property access patterns that might cause errors:');

  const problematicObjects = [
    null,
    undefined,
    {},
    { calculated_status: null },
    { calculated_status: undefined },
    { calculated_status: 123 }, // wrong type
    { calculated_status: {} }, // object instead of string
    { calculated_status: [] }, // array instead of string
    Object.create(null), // object with no prototype
    new Proxy({}, { get: () => { throw new Error('Proxy access error') } })
  ];

  problematicObjects.forEach((obj, index) => {
    console.log(`\nTesting object ${index + 1}: ${obj === null ? 'null' : obj === undefined ? 'undefined' : typeof obj}`);

    try {
      // Test the property access patterns used in the filter
      const hasStatus = obj && obj.calculated_status;
      console.log(`✅ Property access succeeded: hasStatus = ${hasStatus}`);

      if (hasStatus) {
        const statusMatch = obj.calculated_status === "upcoming";
        console.log(`✅ Status comparison succeeded: ${statusMatch}`);
      }

    } catch (error) {
      console.log(`❌ Property access failed: ${error.message}`);
    }
  });
}

testPropertyAccess();

console.log('\n💡 ROOT CAUSE ANALYSIS:');
console.log('=======================');
console.log('The error at line 176:29 is likely caused by:');
console.log('1. processedTournaments array being null/undefined when filter() is called');
console.log('2. Individual tournament objects having getter properties that throw errors');
console.log('3. calculated_status property access failing on malformed objects');
console.log('4. String comparison operations failing with non-string values');
console.log('5. The error might actually be on line 175 but reported as 176:29');

console.log('\n🔧 POTENTIAL SOLUTIONS:');
console.log('=======================');
console.log('1. Add null check for processedTournaments array before calling filter()');
console.log('2. Add additional safety checks inside the filter function');
console.log('3. Wrap the entire filter operation in try-catch');
console.log('4. Add type checking for calculated_status before comparison');
console.log('5. Add fallback empty array if processedTournaments is invalid');

console.log('\nNext: Implement fixes for the identified filtering issues');
