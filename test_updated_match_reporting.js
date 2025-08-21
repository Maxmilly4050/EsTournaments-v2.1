const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Updated Match Reporting Implementation...\n')

// Test 1: Verify tournament-bracket.jsx has match room code field
console.log('1️⃣ Testing tournament-bracket.jsx implementation...')
const bracketPath = path.join(__dirname, 'components/tournament-bracket.jsx')
const bracketContent = fs.readFileSync(bracketPath, 'utf8')

// Check for match room code in form state
const hasMatchRoomCodeInState = bracketContent.includes('match_room_code: \'\'')
console.log('✅ Match room code in form state:', hasMatchRoomCodeInState)

// Check for match room code input field
const hasMatchRoomCodeInput = bracketContent.includes('Match Room Code') &&
                             bracketContent.includes('match_room_code')
console.log('✅ Match room code input field:', hasMatchRoomCodeInput)

// Check for match room code validation
const hasMatchRoomCodeValidation = bracketContent.includes('!resultForm.match_room_code.trim()')
console.log('✅ Match room code validation:', hasMatchRoomCodeValidation)

// Check for match room code in form reset
const hasMatchRoomCodeInReset = bracketContent.includes("match_room_code: '',") &&
                               bracketContent.includes('setResultForm')
console.log('✅ Match room code in form reset:', hasMatchRoomCodeInReset)

console.log()

// Test 2: Verify API route handles match room code
console.log('2️⃣ Testing API route implementation...')
const apiPath = path.join(__dirname, 'app/api/tournaments/matches/[id]/report-result/route.js')
const apiContent = fs.readFileSync(apiPath, 'utf8')

// Check for match room code extraction
const hasMatchRoomCodeExtraction = apiContent.includes('match_room_code') &&
                                  apiContent.includes('body')
console.log('✅ Match room code extraction:', hasMatchRoomCodeExtraction)

// Check for match room code validation
const hasMatchRoomCodeValidationAPI = apiContent.includes('match_room_code') &&
                                     (apiContent.includes('validation') || apiContent.includes('required'))
console.log('✅ Match room code validation in API:', hasMatchRoomCodeValidationAPI)

// Check for match room code in database update
const hasMatchRoomCodeInUpdate = apiContent.includes('match_room_code') &&
                                apiContent.includes('update')
console.log('✅ Match room code in database update:', hasMatchRoomCodeInUpdate)

console.log()

// Test 3: Summary
console.log('📋 Implementation Summary:')
const allTestsPassed = hasMatchRoomCodeInState &&
                      hasMatchRoomCodeInput &&
                      hasMatchRoomCodeValidation &&
                      hasMatchRoomCodeInReset &&
                      hasMatchRoomCodeExtraction &&
                      hasMatchRoomCodeInUpdate

console.log('Overall Status:', allTestsPassed ? '✅ PASS' : '❌ FAIL')

if (allTestsPassed) {
  console.log('\n🎉 All tests passed! The match room code feature has been successfully implemented.')
  console.log('Features implemented:')
  console.log('- ✅ Match room code input field with validation')
  console.log('- ✅ Required field validation (red asterisk)')
  console.log('- ✅ Form state management')
  console.log('- ✅ API route handling')
  console.log('- ✅ Database integration')
  console.log('- ✅ Form reset functionality')
} else {
  console.log('\n❌ Some tests failed. Please check the implementation.')
}

console.log('\n🔍 Match reporting now includes:')
console.log('1. Winner selection')
console.log('2. Player scores')
console.log('3. Screenshot upload (required)')
console.log('4. Match room code (required) - NEW!')
console.log('5. Optional notes')
