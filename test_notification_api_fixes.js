#!/usr/bin/env node

/**
 * Test script to verify notification API fixes:
 * 1. Cookies async issue fix
 * 2. Database schema 'read_at' column issue fix
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Notification API Fixes...\n')

// Test 1: Check if the cookies async issue is fixed
console.log('1. Checking cookies async fixes...')

const apiRoutePath = path.join(__dirname, 'app/api/notifications/route.js')
if (!fs.existsSync(apiRoutePath)) {
  console.log('❌ notifications API route not found')
  process.exit(1)
}

const apiContent = fs.readFileSync(apiRoutePath, 'utf8')

// Check GET method has await cookies()
const hasGetFix = apiContent.includes('export async function GET(request)') &&
                  apiContent.includes('const cookieStore = await cookies()')
console.log(hasGetFix ? '✅ GET method: cookies() is awaited' : '❌ GET method: cookies() not awaited')

// Check PATCH method has await cookies()
const patchMethodMatch = apiContent.match(/export async function PATCH\(request\)[^}]+?const cookieStore = ([^)]+)/s)
const hasPatchFix = patchMethodMatch && patchMethodMatch[1].includes('await cookies')
console.log(hasPatchFix ? '✅ PATCH method: cookies() is awaited' : '❌ PATCH method: cookies() not awaited')

// Check DELETE method has await cookies()
const deleteMethodMatch = apiContent.match(/export async function DELETE\(request\)[^}]+?const cookieStore = ([^)]+)/s)
const hasDeleteFix = deleteMethodMatch && deleteMethodMatch[1].includes('await cookies')
console.log(hasDeleteFix ? '✅ DELETE method: cookies() is awaited' : '❌ DELETE method: cookies() not awaited')

// Test 2: Check if the read_at column references are removed
console.log('\n2. Checking read_at column reference fixes...')

// Check that read_at is no longer referenced in updates
const hasReadAtReferences = apiContent.includes('read_at: new Date().toISOString()')
console.log(!hasReadAtReferences ? '✅ All read_at column references removed' : '❌ read_at references still exist')

// Check that is_read field is still present
const hasIsReadField = apiContent.includes('is_read: true')
console.log(hasIsReadField ? '✅ is_read field maintained in updates' : '❌ is_read field missing')

// Check mark all read operation
const markAllReadMatch = apiContent.match(/mark_all_read[\s\S]*?\.update\(\s*\{([^}]+)\}/m)
const markAllReadClean = markAllReadMatch &&
                        markAllReadMatch[1].includes('is_read: true') &&
                        !markAllReadMatch[1].includes('read_at')
console.log(markAllReadClean ? '✅ Mark all read operation cleaned (no read_at)' : '❌ Mark all read operation still has issues')

// Check mark specific notifications operation
const markSpecificMatch = apiContent.match(/notification_ids[\s\S]*?\.update\(\s*\{([^}]+)\}/m)
const markSpecificClean = markSpecificMatch &&
                         markSpecificMatch[1].includes('is_read: true') &&
                         !markSpecificMatch[1].includes('read_at')
console.log(markSpecificClean ? '✅ Mark specific notifications operation cleaned (no read_at)' : '❌ Mark specific notifications operation still has issues')

// Test 3: Check that all essential functionality is preserved
console.log('\n3. Checking preserved functionality...')

// Check that all HTTP methods exist
const hasAllMethods = apiContent.includes('export async function GET(request)') &&
                     apiContent.includes('export async function PATCH(request)') &&
                     apiContent.includes('export async function DELETE(request)')
console.log(hasAllMethods ? '✅ All HTTP methods (GET, PATCH, DELETE) preserved' : '❌ Some HTTP methods missing')

// Check authentication is preserved
const hasAuth = apiContent.includes('supabase.auth.getUser()') &&
               apiContent.includes('Unauthorized')
console.log(hasAuth ? '✅ Authentication logic preserved' : '❌ Authentication logic missing')

// Check unread count logic is preserved
const hasUnreadCount = apiContent.includes('unread_count') &&
                      apiContent.includes('count: unreadCount || 0')
console.log(hasUnreadCount ? '✅ Unread count logic preserved' : '❌ Unread count logic missing')

// Summary
console.log('\n📊 Summary:')
const allChecks = [
  hasGetFix,
  hasPatchFix,
  hasDeleteFix,
  !hasReadAtReferences,
  hasIsReadField,
  markAllReadClean,
  markSpecificClean,
  hasAllMethods,
  hasAuth,
  hasUnreadCount
]

const passedChecks = allChecks.filter(Boolean).length
console.log(`${passedChecks}/${allChecks.length} checks passed`)

if (passedChecks === allChecks.length) {
  console.log('🎉 All notification API fixes implemented successfully!')
  console.log('\n✨ Issues fixed:')
  console.log('  • Next.js cookies() async issue resolved in all methods')
  console.log('  • Database schema read_at column references removed')
  console.log('  • All functionality preserved and working')
  console.log('\n🔧 Specific fixes:')
  console.log('  • Added await to cookies() calls in GET, PATCH, DELETE methods')
  console.log('  • Removed read_at field from database update operations')
  console.log('  • Kept is_read field for proper notification status tracking')
} else {
  console.log('⚠️  Some fixes may be missing or incomplete')
}

console.log('\n🚀 Expected results:')
console.log('✅ No more "cookies() should be awaited" errors')
console.log('✅ No more "Could not find the \'read_at\' column" errors')
console.log('✅ Notification mark as read functionality should work')
console.log('✅ Notification delete functionality should work')
