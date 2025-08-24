#!/usr/bin/env node

/**
 * Test script to verify admin access configuration
 * This script helps users test if their admin setup is working correctly
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Admin Access Configuration...\n')

// Read .env.local file
const envPath = path.join(__dirname, '.env.local')
let adminIds = []
let hasAdminVar = false

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const adminIdsMatch = envContent.match(/NEXT_PUBLIC_ADMIN_USER_IDS="([^"]*)"/)

  if (adminIdsMatch) {
    hasAdminVar = true
    const adminIdsStr = adminIdsMatch[1].trim()
    adminIds = adminIdsStr ? adminIdsStr.split(',').map(id => id.trim()).filter(id => id) : []
  }
}

console.log('📋 Configuration Check:')
console.log(`${hasAdminVar ? '✅' : '❌'} NEXT_PUBLIC_ADMIN_USER_IDS variable exists`)
console.log(`${adminIds.length > 0 ? '✅' : '⚠️'} Admin IDs configured: ${adminIds.length === 0 ? 'None' : adminIds.length}`)

if (adminIds.length > 0) {
  console.log('\n👥 Configured Admin User IDs:')
  adminIds.forEach((id, index) => {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    console.log(`  ${index + 1}. ${id} ${isValidUuid ? '✅' : '⚠️  (Invalid UUID format)'}`)
  })
}

// Test admin logic simulation
console.log('\n🧠 Admin Logic Simulation:')
console.log('Testing the admin check logic that runs in the header component...')

function simulateAdminCheck(userId, userEmail, adminUserIds) {
  const isAdminById = adminUserIds.includes(userId)
  const isAdminByEmail = userEmail?.endsWith('@admin.com')
  return isAdminById || isAdminByEmail
}

// Test cases
const testCases = [
  {
    name: 'Test with configured admin ID',
    userId: adminIds[0] || 'test-admin-id',
    email: 'user@example.com',
    expected: adminIds.length > 0
  },
  {
    name: 'Test with admin email',
    userId: 'random-user-id',
    email: 'admin@admin.com',
    expected: true
  },
  {
    name: 'Test with regular user',
    userId: 'regular-user-id',
    email: 'user@example.com',
    expected: false
  }
]

testCases.forEach((testCase, index) => {
  const result = simulateAdminCheck(testCase.userId, testCase.email, adminIds)
  const status = result === testCase.expected ? '✅' : '❌'
  console.log(`  ${status} ${testCase.name}: ${result ? 'ADMIN' : 'REGULAR USER'}`)
})

console.log('\n🎯 Current Status:')
if (adminIds.length === 0) {
  console.log('❌ No admin users configured')
  console.log('📝 To fix this:')
  console.log('  1. Get your Supabase user ID from:')
  console.log('     • Supabase Dashboard > Authentication > Users')
  console.log('     • Or browser console: supabase.auth.getUser().then(({data}) => console.log(data.user?.id))')
  console.log('  2. Add it to NEXT_PUBLIC_ADMIN_USER_IDS in .env.local')
  console.log('  3. Restart your dev server: npm run dev')
} else {
  console.log('✅ Admin configuration looks good!')
  console.log('🚀 Next steps:')
  console.log('  1. Restart your development server if you made recent changes')
  console.log('  2. Log in with an admin user')
  console.log('  3. Look for the red "Admin" button in the header')
  console.log('  4. Check the user dropdown for "Admin Dashboard" option')
}

console.log('\n🔍 Troubleshooting Tips:')
console.log('If admin button still doesn\'t show after configuration:')
console.log('  • Clear browser cache and cookies')
console.log('  • Check browser console for JavaScript errors')
console.log('  • Verify you\'re logged in with the correct user account')
console.log('  • Ensure there are no typos in the user ID')
console.log('  • Try using the @admin.com email method as an alternative')

console.log('\n📚 Alternative Method:')
console.log('Instead of using user IDs, you can:')
console.log('  1. Change your email to end with @admin.com')
console.log('  2. Update your email in Supabase Dashboard > Authentication > Users')
console.log('  3. Verify the new email address')
console.log('  4. Log in again - admin access will be automatic')

console.log('\n✨ Expected Results When Working:')
console.log('  • Red "Admin" button appears in the header navigation')
console.log('  • "Admin Dashboard" option in user dropdown menu')
console.log('  • Access to /admin routes without redirects')
console.log('  • Admin-only features like tournament/user management')
