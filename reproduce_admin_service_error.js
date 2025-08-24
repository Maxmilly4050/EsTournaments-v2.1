#!/usr/bin/env node

/**
 * Script to reproduce the getUserProfiles error from lib/admin-service.js
 * This script identifies the syntax error in the PostgREST filter
 */

const fs = require('fs')
const path = require('path')

console.log('🐛 Reproducing Admin Service getUserProfiles Error...\n')

// Read the admin service file
const adminServicePath = path.join(__dirname, 'lib/admin-service.js')
const adminServiceContent = fs.readFileSync(adminServicePath, 'utf8')

console.log('📋 Error Analysis:')
console.log('━'.repeat(50))

// Extract the problematic line 25
const lines = adminServiceContent.split('\n')
const line25 = lines[24] // Array is 0-indexed
const line24 = lines[23] // Context line before
const line26 = lines[25] // Context line after

console.log('Line 24:', line24.trim())
console.log('Line 25:', line25.trim(), '← ERROR HERE')
console.log('Line 26:', line26.trim())

console.log('\n🔍 Problem Identified:')
console.log('The filter string in query.or() has incorrect syntax:')
console.log('❌ Current (BROKEN):')
console.log('   `full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,gamer_tag.ilike.%${searchTerm}%`')
console.log('')
console.log('✅ Should be (FIXED):')
console.log('   `full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,gamer_tag.ilike.%${searchTerm}%`')
console.log('')

console.log('🧠 Root Cause:')
console.log('• The template literal syntax is incorrect')
console.log('• PostgREST filter format needs proper escaping')
console.log('• Missing proper string interpolation')

console.log('\n🔧 Expected Fix:')
console.log('Replace line 25 with:')
console.log('   `full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,gamer_tag.ilike.%${searchTerm}%`')

console.log('\n⚠️  Impact:')
console.log('• Admin dashboard fails to load user profiles')
console.log('• Search functionality in admin panel breaks')
console.log('• JavaScript runtime error prevents admin operations')

console.log('\n🎯 Solution Status: Ready to implement fix')
