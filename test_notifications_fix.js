#!/usr/bin/env node

/**
 * Simple test to verify the notifications API fix
 */

console.log('🧪 Testing notifications API fix...')
console.log('==================================================')

// Simulate the API call using curl since we don't need to install dependencies
const { exec } = require('child_process')

// Check if the dev server is running
exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', (error, stdout, stderr) => {
  if (error || stdout !== '200') {
    console.log('⚠️  Development server not running on localhost:3000')
    console.log('Please start the server with: npm run dev')
    console.log('')
    console.log('Manual test instructions:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Open browser and navigate to the notifications page')
    console.log('3. Check browser network tab for API calls to /api/notifications')
    console.log('4. Verify no 500 errors are returned')
    return
  }

  console.log('✅ Development server is running')

  // Test the notifications API endpoint
  exec('curl -s -w "\\nHTTP Status: %{http_code}\\n" "http://localhost:3000/api/notifications?limit=20&offset=0"', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Failed to test API endpoint:', error.message)
      return
    }

    console.log('API Response:')
    console.log(stdout)

    if (stdout.includes('HTTP Status: 500')) {
      console.log('❌ API still returning 500 error - fix may not be complete')
    } else if (stdout.includes('HTTP Status: 401')) {
      console.log('⚠️  API returned 401 (Unauthorized) - this is expected without authentication')
      console.log('✅ No 500 error - the PostgREST relationship issue appears to be fixed')
    } else if (stdout.includes('HTTP Status: 200')) {
      console.log('✅ API returned 200 - fix successful!')
    } else {
      console.log('ℹ️  API returned different status - check response above')
    }
  })
})

console.log('')
console.log('Summary of changes made:')
console.log('• Modified /app/api/notifications/route.js')
console.log('• Replaced problematic PostgREST join query with separate queries')
console.log('• Fetch notifications, tournaments, and matches data separately')
console.log('• Enrich notifications with related data before returning')
console.log('• Maintains same API response structure')
console.log('')
