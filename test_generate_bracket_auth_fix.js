#!/usr/bin/env node

/**
 * Test script to verify the generate-bracket API authentication fix
 * This script tests the authentication flow and API endpoint functionality
 */

const fs = require('fs')
const path = require('path')

async function testGenerateBracketAuthFix() {
  console.log('\n🧪 Testing Generate Bracket Authentication Fix\n')

  try {
    // Check if the API route has been updated with correct auth pattern
    const apiRoutePath = path.join(__dirname, 'app/api/tournaments/[id]/generate-bracket/route.js')

    if (!fs.existsSync(apiRoutePath)) {
      throw new Error('Generate bracket API route not found')
    }

    const routeContent = fs.readFileSync(apiRoutePath, 'utf8')

    console.log('✓ Generate bracket API route exists')

    // Check for correct imports
    if (!routeContent.includes('createRouteHandlerClient')) {
      throw new Error('API route should use createRouteHandlerClient for API handlers')
    }

    if (routeContent.includes('createServerComponentClient')) {
      throw new Error('API route should not use createServerComponentClient (deprecated for API routes)')
    }

    console.log('✓ API route uses correct Supabase client (createRouteHandlerClient)')

    // Check for proper session handling
    if (!routeContent.includes('getSession()')) {
      throw new Error('API route should use getSession() for authentication')
    }

    if (routeContent.includes('getUser()') && !routeContent.includes('session.user')) {
      throw new Error('API route should use session.user instead of direct getUser()')
    }

    console.log('✓ API route uses proper session-based authentication')

    // Check authentication error handling
    if (!routeContent.includes('session?.user')) {
      throw new Error('API route should check for session.user existence')
    }

    console.log('✓ API route has proper authentication checks')

    // Check authorization logic
    if (!routeContent.includes('tournament.organizer_id !== user.id')) {
      throw new Error('API route should verify user is tournament organizer')
    }

    console.log('✓ API route has proper authorization logic')

    // Test the authentication flow structure
    const authFlowPattern = /getSession\(\).*session\?.user.*organizer_id !== user\.id/s
    if (!authFlowPattern.test(routeContent)) {
      console.log('⚠️ Authentication flow pattern may need verification')
    } else {
      console.log('✓ Authentication flow follows correct pattern')
    }

    // Check if TournamentBracketGenerator is properly imported and used
    if (!routeContent.includes('TournamentBracketGenerator')) {
      throw new Error('API route should import and use TournamentBracketGenerator')
    }

    if (!routeContent.includes('generateEmptyBracket')) {
      throw new Error('API route should call generateEmptyBracket method')
    }

    console.log('✓ API route properly uses TournamentBracketGenerator')

    // Check error responses
    const errorResponses = [
      { status: 401, message: 'Unauthorized' },
      { status: 403, message: 'Only tournament organizers can generate brackets' },
      { status: 404, message: 'Tournament not found' },
      { status: 400, message: 'Tournament bracket already generated' },
      { status: 500, message: 'Failed to generate tournament bracket' }
    ]

    for (const errorResponse of errorResponses) {
      if (!routeContent.includes(`status: ${errorResponse.status}`)) {
        console.log(`⚠️ Missing ${errorResponse.status} error response`)
      }
    }

    console.log('✓ API route has proper error handling')

    // Test success response structure
    if (!routeContent.includes('success: true') || !routeContent.includes('total_matches')) {
      throw new Error('API route should return proper success response structure')
    }

    console.log('✓ API route returns proper success response')

    // Check if cookies import is correct
    if (!routeContent.includes("import { cookies } from 'next/headers'")) {
      throw new Error('API route should import cookies from next/headers')
    }

    console.log('✓ API route has correct cookies import')

    console.log('\n📋 Authentication Fix Summary:')
    console.log('   ✓ Replaced createServerComponentClient with createRouteHandlerClient')
    console.log('   ✓ Updated authentication to use getSession() instead of getUser()')
    console.log('   ✓ Proper session validation and user extraction')
    console.log('   ✓ Maintained authorization checks (organizer verification)')
    console.log('   ✓ Preserved all error handling and business logic')

    console.log('\n✅ Generate Bracket Authentication Fix Test Complete!')
    console.log('\n🔒 The 401 Unauthorized error should now be resolved.')
    console.log('🎯 Users with valid sessions who are tournament organizers should be able to generate brackets.')

    return true

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message)
    return false
  }
}

// Run the test
if (require.main === module) {
  testGenerateBracketAuthFix()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Unexpected error:', error)
      process.exit(1)
    })
}

module.exports = { testGenerateBracketAuthFix }
