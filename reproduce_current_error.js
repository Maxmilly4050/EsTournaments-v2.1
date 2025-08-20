// Script to reproduce the current unhandled error at line 315
console.log('🔍 Reproducing Current Unhandled Error');
console.log('=====================================');

// Simulate the exact conditions that might cause an error at line 315
// Line 315 is: prize_pool: formData.prizePool || null,

console.log('\n1. Analyzing Line 315:');
console.log('======================');
console.log('Current code: prize_pool: formData.prizePool || null,');

// Test different formData.prizePool values that might cause issues
const testCases = [
  { prizePool: "", description: "Empty string" },
  { prizePool: null, description: "Null value" },
  { prizePool: undefined, description: "Undefined value" },
  { prizePool: "1000 TZS", description: "Valid string" },
  { prizePool: 0, description: "Zero number" },
  { prizePool: false, description: "Boolean false" },
  { prizePool: {}, description: "Empty object" },
  { prizePool: [], description: "Empty array" }
];

console.log('\n2. Testing Different formData.prizePool Values:');
console.log('==============================================');

testCases.forEach((testCase, index) => {
  try {
    const result = testCase.prizePool || null;
    console.log(`✅ Test ${index + 1} (${testCase.description}): ${JSON.stringify(testCase.prizePool)} → ${JSON.stringify(result)}`);
  } catch (error) {
    console.log(`❌ Test ${index + 1} (${testCase.description}): ERROR - ${error.message}`);
  }
});

console.log('\n3. Checking for Potential Issues:');
console.log('=================================');

// Check if the issue might be with formData access itself
console.log('Possible causes for unhandled error:');
console.log('1. formData is null/undefined when accessing .prizePool');
console.log('2. There\'s an async operation issue in the handleSubmit function');
console.log('3. The error might be occurring in a different part of the code');
console.log('4. Browser compatibility issue with nullish coalescing');

console.log('\n4. Simulating Full Context:');
console.log('===========================');

// Simulate the actual context where line 315 runs
try {
  const mockFormData = {
    name: "Test Tournament",
    game: "eFootball 2026",
    description: "Test",
    tournamentType: "single_elimination",
    bracketSize: "16",
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    prizePool: "", // Empty string that might cause issues
    isFree: true,
    entryFeeAmount: "",
    entryFeeCurrency: "TZS"
  };

  // Simulate the tournament insert data construction
  const entryFeeText = mockFormData.isFree ? "Free" : `${mockFormData.entryFeeAmount || "0"} ${mockFormData.entryFeeCurrency}`;

  const insertData = {
    name: mockFormData.name,
    game: mockFormData.game,
    description: mockFormData.description,
    tournament_type: mockFormData.tournamentType,
    max_participants: parseInt(mockFormData.bracketSize),
    start_date: mockFormData.startDate ? new Date(mockFormData.startDate).toISOString() : null,
    end_date: mockFormData.endDate ? new Date(mockFormData.endDate).toISOString() : null,
    prize_pool: mockFormData.prizePool || null, // This is line 315
    entry_fee: entryFeeText,
    created_by: 'mock-user-id'
  };

  console.log('✅ Insert data constructed successfully:');
  console.log('prize_pool value:', JSON.stringify(insertData.prize_pool));

} catch (error) {
  console.log('❌ Error in insert data construction:', error.message);
}

console.log('\n5. Alternative Possibilities:');
console.log('=============================');
console.log('The error might actually be occurring at:');
console.log('- Line 315 in a different file');
console.log('- A different line that was renumbered');
console.log('- An async/await issue in the handleSubmit function');
console.log('- A React state update issue');
console.log('- A Supabase client configuration issue');

console.log('\n🔧 Next Steps:');
console.log('==============');
console.log('1. Check if there are any React Strict Mode double-rendering issues');
console.log('2. Verify the Supabase client is properly configured');
console.log('3. Add more detailed error logging around line 315');
console.log('4. Check if the error occurs during form validation or submission');
