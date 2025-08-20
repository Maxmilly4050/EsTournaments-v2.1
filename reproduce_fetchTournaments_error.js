// Script to reproduce the fetchTournaments error in tournament-section.jsx
console.log('🔍 Reproducing fetchTournaments Error');
console.log('====================================');

console.log('\n1. Analyzing fetchTournaments Function:');
console.log('======================================');
console.log('Function: fetchTournaments() at line 44-113 in tournament-section.jsx');
console.log('Error location: Line 106 (console.error in catch block)');
console.log('Actual error likely occurs in the try block (lines 45-105)');

console.log('\n2. Examining Supabase Query Structure:');
console.log('=====================================');

const queryAnalysis = {
  table: 'tournaments',
  select: `
    id, name, description, game, max_participants, current_participants,
    status, start_date, end_date, prize_pool, entry_fee, created_at, created_by
  `,
  ordering: 'created_at DESC',
  filtering: 'status-based filtering with date comparisons'
};

console.log('Query details:', queryAnalysis);

console.log('\n3. Potential Issues Analysis:');
console.log('=============================');

console.log('🔍 Possible Error Sources:');
console.log('1. Supabase query execution failure');
console.log('2. Data processing errors in filter/map operations');
console.log('3. Date parsing issues in getCorrectTournamentStatus function');
console.log('4. Null/undefined tournament data causing property access errors');
console.log('5. Status comparison logic failing');

console.log('\n🔍 Critical Code Sections:');
console.log('==========================');
console.log('Line 78: const result = await query');
console.log('Line 85: result.data?.filter((tournament) => tournament.created_by)');
console.log('Line 88-90: fetchedTournaments.map(tournament => ({ ...tournament, calculated_status: getCorrectTournamentStatus(tournament) }))');
console.log('Line 91-102: .filter(tournament => { status comparison logic })');

console.log('\n🔍 getCorrectTournamentStatus Function Analysis:');
console.log('===============================================');
console.log('This function processes tournament dates and could fail if:');
console.log('- tournament.start_date is null/undefined/invalid');
console.log('- tournament.end_date is null/undefined/invalid');
console.log('- Date constructor fails with invalid date strings');

console.log('\n🔍 Expected Error Scenarios:');
console.log('============================');

// Test getCorrectTournamentStatus with problematic data
function testStatusCalculation() {
  console.log('\nTesting getCorrectTournamentStatus with various tournament data:');

  const problemTournaments = [
    { start_date: null, end_date: null, description: 'Null dates' },
    { start_date: undefined, end_date: undefined, description: 'Undefined dates' },
    { start_date: 'invalid-date', end_date: 'invalid-date', description: 'Invalid date strings' },
    { start_date: '', end_date: '', description: 'Empty date strings' },
    { description: 'Missing date properties' } // No start_date or end_date
  ];

  problemTournaments.forEach((tournament, index) => {
    try {
      const now = new Date();

      // Simulate the getCorrectTournamentStatus logic
      const startDate = new Date(tournament.start_date);
      const endDate = tournament.end_date ? new Date(tournament.end_date) : null;

      console.log(`✅ Test ${index + 1} (${tournament.description}): No immediate error`);
      console.log(`   - startDate: ${startDate}`);
      console.log(`   - endDate: ${endDate}`);

    } catch (error) {
      console.log(`❌ Test ${index + 1} (${tournament.description}): ERROR - ${error.message}`);
    }
  });
}

testStatusCalculation();

console.log('\n💡 ROOT CAUSE HYPOTHESIS:');
console.log('=========================');
console.log('The error is likely caused by:');
console.log('1. Invalid date data in tournament records causing Date constructor errors');
console.log('2. Null/undefined tournament properties being accessed without proper checks');
console.log('3. Supabase query returning malformed data');
console.log('4. Error in the catch block itself when trying to access error properties');

console.log('\n🔧 POTENTIAL FIXES:');
console.log('===================');
console.log('1. Add null/undefined checks for tournament dates in getCorrectTournamentStatus');
console.log('2. Add try-catch around individual tournament processing in map/filter operations');
console.log('3. Improve error handling in the catch block to prevent recursive errors');
console.log('4. Add validation for tournament data before processing');
console.log('5. Add fallback behavior for invalid tournament data');

console.log('\nNext: Create a fix for the fetchTournaments function');
