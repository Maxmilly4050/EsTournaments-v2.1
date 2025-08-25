/**
 * Reproduce fetchMatches Error
 * Test script to isolate and understand the fetchMatches error in tournament-bracket.jsx
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables manually from .env.local
let supabaseUrl, supabaseAnonKey
try {
  const envPath = path.join(__dirname, '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')

  envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim().replace(/^["']|["']$/g, '').replace(/\/$/, '')
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim().replace(/^["']|["']$/g, '')
    }
  })
} catch (error) {
  console.log('Could not read .env.local file:', error.message)
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function reproduceFetchMatchesError() {
  console.log('🔍 Reproducing fetchMatches Error')
  console.log('=====================================')

  // Test with a sample tournament ID
  const testTournamentId = 1

  console.log(`📋 Testing fetchMatches query for tournament ID: ${testTournamentId}`)

  try {
    // Test the exact query structure from tournament-bracket.jsx line 101-123
    console.log('\n1️⃣ Testing the original fetchMatches query...')

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:profiles!player1_id (
          id,
          username,
          full_name
        ),
        player2:profiles!player2_id (
          id,
          username,
          full_name
        ),
        winner:profiles!winner_id (
          id,
          username,
          full_name
        )
      `)
      .eq('tournament_id', testTournamentId)
      .order('round')
      .order('match_number')

    if (error) {
      console.error('❌ Original query failed:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
    } else {
      console.log('✅ Original query succeeded')
      console.log('Matches found:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('Sample match:', JSON.stringify(data[0], null, 2))
      }
    }

  } catch (error) {
    console.error('❌ Exception during original query:', error)
  }

  try {
    // Test 2: Check if matches table exists and has the expected columns
    console.log('\n2️⃣ Testing matches table structure...')

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Matches table query failed:', error)
    } else {
      console.log('✅ Matches table accessible')
      if (data && data.length > 0) {
        console.log('Table columns:', Object.keys(data[0]))
      }
    }

  } catch (error) {
    console.error('❌ Exception during table structure test:', error)
  }

  try {
    // Test 3: Check if profiles table exists and relationships work
    console.log('\n3️⃣ Testing profiles table relationships...')

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .limit(1)

    if (error) {
      console.error('❌ Profiles table query failed:', error)
    } else {
      console.log('✅ Profiles table accessible')
      if (data && data.length > 0) {
        console.log('Sample profile:', data[0])
      }
    }

  } catch (error) {
    console.error('❌ Exception during profiles test:', error)
  }

  try {
    // Test 4: Simplified matches query without joins
    console.log('\n4️⃣ Testing simplified matches query without joins...')

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', testTournamentId)
      .order('round')
      .order('match_number')

    if (error) {
      console.error('❌ Simplified query failed:', error)
    } else {
      console.log('✅ Simplified query succeeded')
      console.log('Matches found:', data?.length || 0)
    }

  } catch (error) {
    console.error('❌ Exception during simplified query:', error)
  }

  try {
    // Test 5: Test with different ordering
    console.log('\n5️⃣ Testing query with single order clause...')

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:profiles!player1_id (
          id,
          username,
          full_name
        ),
        player2:profiles!player2_id (
          id,
          username,
          full_name
        ),
        winner:profiles!winner_id (
          id,
          username,
          full_name
        )
      `)
      .eq('tournament_id', testTournamentId)
      .order('round')

    if (error) {
      console.error('❌ Single order query failed:', error)
    } else {
      console.log('✅ Single order query succeeded')
      console.log('Matches found:', data?.length || 0)
    }

  } catch (error) {
    console.error('❌ Exception during single order test:', error)
  }

  try {
    // Test 6: Test foreign key relationships individually
    console.log('\n6️⃣ Testing individual foreign key relationships...')

    // Test player1 relationship
    const { data: player1Data, error: player1Error } = await supabase
      .from('matches')
      .select(`
        id,
        player1:profiles!player1_id (
          id,
          username,
          full_name
        )
      `)
      .eq('tournament_id', testTournamentId)
      .limit(1)

    if (player1Error) {
      console.error('❌ Player1 relationship failed:', player1Error)
    } else {
      console.log('✅ Player1 relationship works')
    }

  } catch (error) {
    console.error('❌ Exception during foreign key test:', error)
  }

  console.log('\n🔍 fetchMatches error reproduction completed')
}

// Run the reproduction script
if (require.main === module) {
  reproduceFetchMatchesError()
    .then(() => {
      console.log('\n📝 Reproduction script completed')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Script execution failed:', error)
      process.exit(1)
    })
}

module.exports = { reproduceFetchMatchesError }
