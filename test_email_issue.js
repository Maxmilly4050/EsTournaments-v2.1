#!/usr/bin/env node

/**
 * Test script to reproduce the email verification issue
 * This will help identify why verification emails are not being sent
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
  process.exit(1)
}

console.log("=== Email Verification Issue Test ===")
console.log("Testing why verification emails are not being sent...")

async function testEmailVerification() {
  try {
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    console.log("\n1. Testing Supabase connection...")
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError && !userError.message.includes('invalid JWT')) {
      console.log(`❌ Supabase auth error: ${userError.message}`)
    } else {
      console.log("✓ Supabase connection successful")
    }

    console.log("\n2. Testing email resend functionality...")
    // Test the resend function directly
    const testEmail = 'test@example.com'
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

    console.log(`Testing with email: ${testEmail}`)
    console.log(`Redirect URL: ${redirectUrl}`)

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: testEmail,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    if (resendError) {
      console.log(`❌ Email resend error: ${resendError.message}`)

      // Check common issues
      if (resendError.message.includes('Email not confirmed')) {
        console.log("💡 This suggests the user needs to be signed up first")
      } else if (resendError.message.includes('Invalid email')) {
        console.log("💡 Email format issue")
      } else if (resendError.message.includes('SMTP')) {
        console.log("💡 SMTP/Email provider configuration issue in Supabase")
      } else if (resendError.message.includes('rate limit')) {
        console.log("💡 Rate limiting - too many requests")
      } else {
        console.log("💡 Unknown email error - check Supabase dashboard email settings")
      }
    } else {
      console.log("✓ Email resend function works (but may not actually send without real user)")
    }

    console.log("\n3. Checking Supabase configuration...")
    console.log("Environment variables:")
    console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    console.log(`- NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL}`)
    console.log(`- Anon key present: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
  }

  console.log("\n=== Diagnostic Summary ===")
  console.log("Common reasons why verification emails don't get sent:")
  console.log("1. ❌ No email provider configured in Supabase dashboard")
  console.log("2. ❌ Email provider (SMTP) settings are incorrect")
  console.log("3. ❌ Email templates are disabled or misconfigured")
  console.log("4. ❌ User is not properly signed up first")
  console.log("5. ❌ Rate limiting is preventing email sending")

  console.log("\n🔧 To fix:")
  console.log("1. Go to Supabase Dashboard > Authentication > Settings")
  console.log("2. Configure an email provider (SMTP settings)")
  console.log("3. Enable 'Confirm email' under Email confirmation")
  console.log("4. Test with a real user signup first, then resend verification")
}

testEmailVerification()
