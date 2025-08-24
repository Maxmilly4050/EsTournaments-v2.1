#!/usr/bin/env node

/**
 * Diagnostic script for admin access issues
 * This script helps identify the current user's ID and test admin functionality
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Diagnosing Admin Access Issue...\n')

// Check if .env.local exists and read it
const envPath = path.join(__dirname, '.env.local')
let envContent = ''
let hasAdminVar = false

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
  hasAdminVar = envContent.includes('NEXT_PUBLIC_ADMIN_USER_IDS')
  console.log('✅ .env.local file found')
} else {
  console.log('❌ .env.local file not found')
}

console.log(`${hasAdminVar ? '✅' : '❌'} NEXT_PUBLIC_ADMIN_USER_IDS variable ${hasAdminVar ? 'found' : 'missing'}`)

if (!hasAdminVar) {
  console.log('\n🚨 ROOT CAUSE IDENTIFIED:')
  console.log('The NEXT_PUBLIC_ADMIN_USER_IDS environment variable is missing from .env.local')
  console.log('This is why the admin button is not showing.')
}

// Check header component implementation
const headerPath = path.join(__dirname, 'components/header.jsx')
if (fs.existsSync(headerPath)) {
  const headerContent = fs.readFileSync(headerPath, 'utf8')

  const hasAdminLogic = headerContent.includes('ADMIN_USER_IDS') &&
                       headerContent.includes('isAdmin') &&
                       headerContent.includes('endsWith("@admin.com")')

  const hasAdminButton = headerContent.includes('isAdmin && (') &&
                        headerContent.includes('Admin')

  console.log(`\n📋 Header Component Analysis:`)
  console.log(`${hasAdminLogic ? '✅' : '❌'} Admin logic implemented`)
  console.log(`${hasAdminButton ? '✅' : '❌'} Admin button implemented`)

  if (hasAdminLogic && hasAdminButton) {
    console.log('✅ Header component implementation is correct')
  }
} else {
  console.log('❌ Header component not found')
}

console.log('\n🔧 SOLUTION:')
console.log('To fix this issue, you need to:')
console.log('1. Find your Supabase user ID')
console.log('2. Add it to the .env.local file')
console.log()
console.log('💡 How to find your Supabase User ID:')
console.log('Method 1 - From Supabase Dashboard:')
console.log('  • Go to https://supabase.com/dashboard')
console.log('  • Navigate to your project')
console.log('  • Go to Authentication > Users')
console.log('  • Find your user and copy the User UID')
console.log()
console.log('Method 2 - From Browser Console:')
console.log('  • Log in to your app')
console.log('  • Open browser Developer Tools (F12)')
console.log('  • Go to Console tab')
console.log('  • Run: supabase.auth.getUser().then(({data}) => console.log("User ID:", data.user?.id))')
console.log()
console.log('Method 3 - Use admin email:')
console.log('  • Change your email to end with @admin.com (e.g., yourname@admin.com)')
console.log('  • This will automatically grant admin access')
console.log()
console.log('📝 After getting your User ID, add this line to .env.local:')
console.log('NEXT_PUBLIC_ADMIN_USER_IDS="your-user-id-here"')
console.log()
console.log('🔄 Then restart your development server:')
console.log('npm run dev')

// Create a sample fix
if (!hasAdminVar) {
  console.log('\n🛠️  Auto-fix attempt:')
  console.log('Adding the missing environment variable to .env.local...')

  const newEnvLine = '\n# Admin user configuration\nNEXT_PUBLIC_ADMIN_USER_IDS=""\n'

  try {
    fs.appendFileSync(envPath, newEnvLine)
    console.log('✅ Added NEXT_PUBLIC_ADMIN_USER_IDS="" to .env.local')
    console.log('⚠️  You still need to add your actual user ID between the quotes')
  } catch (error) {
    console.log('❌ Failed to update .env.local:', error.message)
  }
}

console.log('\n🚀 Next Steps:')
console.log('1. Get your Supabase User ID using one of the methods above')
console.log('2. Update NEXT_PUBLIC_ADMIN_USER_IDS in .env.local with your ID')
console.log('3. Restart the development server')
console.log('4. Log in and check if the Admin button appears in the header')
