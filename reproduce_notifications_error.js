#!/usr/bin/env node

/**
 * Script to reproduce the notifications API error and test the fix
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...')

  try {
    // Check if notifications table exists
    const { data: notificationsTable, error: notificationsError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)

    if (notificationsError) {
      console.error('❌ Notifications table check failed:', notificationsError)
      return false
    }

    console.log('✅ Notifications table exists')

    // Check if tournaments table exists
    const { data: tournamentsTable, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id')
      .limit(1)

    if (tournamentsError) {
      console.error('❌ Tournaments table check failed:', tournamentsError)
      return false
    }

    console.log('✅ Tournaments table exists')

    // Try the problematic query that's failing in the API
    console.log('🧪 Testing problematic query with join...')
    const { data: joinTest, error: joinError } = await supabase
      .from('notifications')
      .select(`
        id,
        tournament_id,
        match_id,
        type,
        title,
        message,
        is_read,
        created_at,
        scheduled_for,
        tournaments (
          id,
          name
        ),
        matches (
          id,
          round,
          match_number
        )
      `)
      .limit(5)

    if (joinError) {
      console.error('❌ Join query failed:', joinError)
      return false
    }

    console.log('✅ Join query succeeded')
    console.log('Query result:', joinTest)

    return true

  } catch (error) {
    console.error('❌ Database schema check failed:', error)
    return false
  }
}

async function testNotificationsAPI() {
  console.log('🧪 Testing notifications API endpoint...')

  try {
    const response = await fetch('http://localhost:3000/api/notifications?limit=20&offset=0')
    const result = await response.text()

    console.log('API Response Status:', response.status)
    console.log('API Response:', result)

    if (response.status === 500) {
      console.error('❌ API returned 500 error - confirming the issue exists')
      return false
    }

    console.log('✅ API call succeeded')
    return true

  } catch (error) {
    console.error('❌ API test failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Testing notifications API error...')
  console.log('==================================================')

  const schemaOk = await checkDatabaseSchema()

  if (schemaOk) {
    console.log('✅ Database schema looks good, testing API...')
    await testNotificationsAPI()
  } else {
    console.log('❌ Database schema issues detected')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { checkDatabaseSchema, testNotificationsAPI }
