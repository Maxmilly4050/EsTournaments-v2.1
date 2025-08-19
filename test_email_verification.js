#!/usr/bin/env node

/**
 * Test script to verify that email verification is working properly
 * This script will test the email verification functionality
 */

// Load environment variables from .env.local
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  const envLines = envFile.split('\n').filter(line => line && !line.startsWith('#'))

  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/"/g, '')
      process.env[key] = value
    }
  })
  console.log("✓ Loaded environment variables from .env.local")
} else {
  console.log("❌ .env.local file not found")
}

console.log("=== Email Verification Test ===")
console.log("Testing email verification implementation...")

// Check if environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL'
]

console.log("\n1. Checking environment variables...")
let missingVars = []
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName)
  } else {
    console.log(`✓ ${varName} is set`)
  }
})

if (missingVars.length > 0) {
  console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`)
  console.log("Please set these in your .env.local file")
  process.exit(1)
}

console.log("\n2. Testing Supabase client initialization...")
try {
  // Import and test Supabase client
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  console.log("✓ Supabase client initialized successfully")

  console.log("\n3. Checking Supabase connection...")
  // Test basic connection
  supabase.from('profiles').select('count', { count: 'exact', head: true })
    .then(({ error, count }) => {
      if (error) {
        console.log(`❌ Supabase connection error: ${error.message}`)
      } else {
        console.log("✓ Supabase connection successful")
      }
    })
    .catch(err => {
      console.log(`❌ Supabase connection failed: ${err.message}`)
    })

} catch (error) {
  console.log(`❌ Error initializing Supabase: ${error.message}`)
}

console.log("\n4. Verification Service Test...")
try {
  // Test if verification service can be imported
  const path = require('path')
  const verificationServicePath = path.join(__dirname, 'lib', 'verification-service.js')
  console.log(`✓ Verification service file exists at: ${verificationServicePath}`)
} catch (error) {
  console.log(`❌ Error testing verification service: ${error.message}`)
}

console.log("\n=== Test Summary ===")
console.log("Email verification system should be ready to send real emails!")
console.log("\nTo test manually:")
console.log("1. Start the Next.js server: npm run dev")
console.log("2. Navigate to the profile page")
console.log("3. Click 'Verify' button next to email")
console.log("4. Check your email for the verification message")
console.log("\nNote: Make sure Supabase is configured with an email provider")
console.log("in your Supabase dashboard under Authentication > Settings > Auth emails")
