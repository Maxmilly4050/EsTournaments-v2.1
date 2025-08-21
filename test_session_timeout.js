#!/usr/bin/env node

/**
 * Test script to verify session timeout configuration
 * Tests the extended 4-hour session timeout implementation
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Session Timeout Configuration...\n')

// Test 1: Verify client.js configuration
console.log('1️⃣ Testing client.js session configuration...')
const clientPath = path.join(__dirname, 'lib/supabase/client.js')
const clientContent = fs.readFileSync(clientPath, 'utf8')

const hasSessionExpiry = clientContent.includes('sessionExpiry: 14400')
const hasAutoRefresh = clientContent.includes('autoRefreshToken: true')
const hasPersistSession = clientContent.includes('persistSession: true')

console.log('✅ Session expiry (4 hours):', hasSessionExpiry ? 'CONFIGURED' : 'MISSING')
console.log('✅ Auto refresh token:', hasAutoRefresh ? 'ENABLED' : 'DISABLED')
console.log('✅ Persist session:', hasPersistSession ? 'ENABLED' : 'DISABLED')

console.log()

// Test 2: Verify server.js configuration
console.log('2️⃣ Testing server.js session configuration...')
const serverPath = path.join(__dirname, 'lib/supabase/server.js')
const serverContent = fs.readFileSync(serverPath, 'utf8')

const serverHasSessionExpiry = serverContent.includes('sessionExpiry: 14400')
const serverHasAutoRefresh = serverContent.includes('autoRefreshToken: true')
const serverHasPersistSession = serverContent.includes('persistSession: true')

console.log('✅ Session expiry (4 hours):', serverHasSessionExpiry ? 'CONFIGURED' : 'MISSING')
console.log('✅ Auto refresh token:', serverHasAutoRefresh ? 'ENABLED' : 'DISABLED')
console.log('✅ Persist session:', serverHasPersistSession ? 'ENABLED' : 'DISABLED')

console.log()

// Test 3: Verify middleware.js configuration
console.log('3️⃣ Testing middleware.js session configuration...')
const middlewarePath = path.join(__dirname, 'lib/supabase/middleware.js')
const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')

const middlewareHasSessionExpiry = middlewareContent.includes('sessionExpiry: 14400')
const middlewareHasAutoRefresh = middlewareContent.includes('autoRefreshToken: true')
const middlewareHasPersistSession = middlewareContent.includes('persistSession: true')

console.log('✅ Session expiry (4 hours):', middlewareHasSessionExpiry ? 'CONFIGURED' : 'MISSING')
console.log('✅ Auto refresh token:', middlewareHasAutoRefresh ? 'ENABLED' : 'DISABLED')
console.log('✅ Persist session:', middlewareHasPersistSession ? 'ENABLED' : 'DISABLED')

console.log()

// Test 4: Calculate session duration
console.log('4️⃣ Verifying session duration calculation...')
const sessionDurationSeconds = 14400
const sessionDurationMinutes = sessionDurationSeconds / 60
const sessionDurationHours = sessionDurationMinutes / 60

console.log(`Session timeout: ${sessionDurationSeconds} seconds`)
console.log(`Session timeout: ${sessionDurationMinutes} minutes`)
console.log(`Session timeout: ${sessionDurationHours} hours`)

console.log()

// Test 5: Overall configuration check
console.log('5️⃣ Overall Configuration Summary:')
const allConfigurationsValid = hasSessionExpiry && serverHasSessionExpiry && middlewareHasSessionExpiry &&
                              hasAutoRefresh && serverHasAutoRefresh && middlewareHasAutoRefresh &&
                              hasPersistSession && serverHasPersistSession && middlewareHasPersistSession

console.log('Configuration Status:', allConfigurationsValid ? '✅ ALL CONFIGURED' : '❌ INCOMPLETE')

if (allConfigurationsValid) {
  console.log('\n🎉 Success! Session timeout has been extended to 4 hours across all Supabase clients.')
  console.log('Configuration applied to:')
  console.log('- ✅ Client-side Supabase client (browser)')
  console.log('- ✅ Server-side Supabase client')
  console.log('- ✅ Middleware Supabase client')
  console.log('\nUsers should no longer see session expiration messages for 4 hours after login.')
} else {
  console.log('\n❌ Configuration incomplete. Some files are missing session timeout settings.')
  console.log('Missing configurations:')
  if (!hasSessionExpiry) console.log('- Client.js session expiry')
  if (!serverHasSessionExpiry) console.log('- Server.js session expiry')
  if (!middlewareHasSessionExpiry) console.log('- Middleware.js session expiry')
}

console.log('\n=== Session Timeout Test Complete ===')
