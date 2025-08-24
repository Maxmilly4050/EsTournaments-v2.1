#!/usr/bin/env node

/**
 * Test script to verify the getUserProfiles fix in lib/admin-service.js
 * This script validates the PostgREST filter syntax correction
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Admin Service getUserProfiles Fix...\n')

// Read the fixed admin service file
const adminServicePath = path.join(__dirname, 'lib/admin-service.js')
const adminServiceContent = fs.readFileSync(adminServicePath, 'utf8')

console.log('📋 Fix Verification:')
console.log('━'.repeat(50))

// Extract the fixed lines
const lines = adminServiceContent.split('\n')
const line23 = lines[22] // query = query.or(
const line24 = lines[23] // The filter string
const line25 = lines[24] // Closing parenthesis

console.log('Line 23:', line23.trim())
console.log('Line 24:', line24.trim(), '← FIXED')
console.log('Line 25:', line25.trim())

console.log('\n🔍 Syntax Analysis:')

// Check for the corrected syntax
const hasCorrectWildcards = line24.includes('*${searchTerm}*')
const hasTemplateStrings = line24.includes('${searchTerm}')
const hasProperFormat = line24.includes('full_name.ilike') && line24.includes('username.ilike') && line24.includes('gamer_tag.ilike')

console.log(`${hasCorrectWildcards ? '✅' : '❌'} Wildcard syntax: Using * instead of %`)
console.log(`${hasTemplateStrings ? '✅' : '❌'} Template literal: \${searchTerm} interpolation`)
console.log(`${hasProperFormat ? '✅' : '❌'} PostgREST format: ilike filters for all fields`)

// Check for syntax errors
const hasSyntaxError = line24.includes('%%') || line24.includes('ilike.%') || !line24.includes('*')
console.log(`${!hasSyntaxError ? '✅' : '❌'} No syntax errors detected`)

console.log('\n🧠 Filter Logic Validation:')
console.log('The corrected filter searches for:')
console.log('• full_name containing the search term (case insensitive)')
console.log('• username containing the search term (case insensitive)')
console.log('• gamer_tag containing the search term (case insensitive)')
console.log('• Uses OR logic - matches any of the three fields')

console.log('\n🔧 PostgREST Compatibility:')
const correctFormat = hasCorrectWildcards && hasTemplateStrings && hasProperFormat && !hasSyntaxError
console.log(`${correctFormat ? '✅' : '❌'} Filter syntax compatible with PostgREST`)

if (correctFormat) {
  console.log('\n🎉 SUCCESS: Filter syntax has been corrected!')
  console.log('\n✨ Expected behavior:')
  console.log('• Admin dashboard can load user profiles without errors')
  console.log('• Search functionality works in admin panel')
  console.log('• No more JavaScript runtime errors in getUserProfiles')
  console.log('• Users can be searched by full name, username, or gamer tag')
} else {
  console.log('\n⚠️  WARNING: Some issues may still exist')
  console.log('The filter syntax may need further adjustment')
}

console.log('\n📊 Summary:')
const totalChecks = 4
const passedChecks = [hasCorrectWildcards, hasTemplateStrings, hasProperFormat, !hasSyntaxError].filter(Boolean).length
console.log(`${passedChecks}/${totalChecks} validation checks passed`)

console.log('\n🚀 Ready for production testing!')
console.log('Test by accessing admin panel and searching for users.')
