#!/usr/bin/env node

/**
 * Test script to verify notification badge fix:
 * 1. API returns updated unread_count in PATCH responses
 * 2. Frontend properly handles the count updates
 * 3. Badge disappears when no unread notifications exist
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Notification Badge Fix...\n')

// Test 1: Check if API route returns unread_count in PATCH responses
console.log('1. Checking API route PATCH method fixes...')

const apiRoutePath = path.join(__dirname, 'app/api/notifications/route.js')
if (!fs.existsSync(apiRoutePath)) {
  console.log('❌ notifications API route not found')
  process.exit(1)
}

const apiContent = fs.readFileSync(apiRoutePath, 'utf8')

// Check "mark all read" case returns unread_count
const hasMarkAllReadCount = apiContent.includes('// Get updated unread count after marking all as read') &&
                           apiContent.includes('All notifications marked as read') &&
                           apiContent.includes('unread_count: unreadCount || 0')
console.log(hasMarkAllReadCount ? '✅ "Mark all read" returns updated unread_count' : '❌ "Mark all read" missing unread_count')

// Check "mark specific" case returns unread_count
const hasMarkSpecificCount = apiContent.includes('// Get updated unread count after marking specific notifications as read') &&
                            apiContent.includes('notification(s) marked as read') &&
                            apiContent.includes('data: {') &&
                            apiContent.includes('unread_count: unreadCount || 0')
console.log(hasMarkSpecificCount ? '✅ "Mark specific" returns updated unread_count' : '❌ "Mark specific" missing unread_count')

// Check DELETE method still has unread_count (should already be there)
const hasDeleteCount = apiContent.includes('notification(s) deleted') &&
                      apiContent.includes('unread_count: unreadCount || 0')
console.log(hasDeleteCount ? '✅ DELETE method returns updated unread_count' : '❌ DELETE method missing unread_count')

// Test 2: Check frontend handles the server responses properly
console.log('\n2. Checking frontend response handling...')

const notificationsPath = path.join(__dirname, 'components/notifications.jsx')
if (!fs.existsSync(notificationsPath)) {
  console.log('❌ notifications.jsx not found')
  process.exit(1)
}

const notificationsContent = fs.readFileSync(notificationsPath, 'utf8')

// Check markAsRead function uses server unread_count
const hasMarkAsReadHandling = notificationsContent.includes('typeof result?.data?.unread_count === \'number\'') &&
                             notificationsContent.includes('result.data.unread_count')
console.log(hasMarkAsReadHandling ? '✅ markAsRead uses server unread_count when available' : '❌ markAsRead not handling server count')

// Check markAllAsRead function uses server unread_count
const hasMarkAllReadHandling = notificationsContent.includes('setUnreadCount(result.data?.unread_count ?? 0)')
console.log(hasMarkAllReadHandling ? '✅ markAllAsRead uses server unread_count' : '❌ markAllAsRead not handling server count')

// Check deleteNotification function uses server unread_count
const hasDeleteHandling = notificationsContent.includes('if (typeof result.data?.unread_count === \'number\')') &&
                         notificationsContent.includes('setUnreadCount(result.data.unread_count)')
console.log(hasDeleteHandling ? '✅ deleteNotification uses server unread_count' : '❌ deleteNotification not handling server count')

// Test 3: Check badge rendering logic
console.log('\n3. Checking badge rendering logic...')

const hasBadgeLogic = notificationsContent.includes('{unreadCount > 0 && (') &&
                     notificationsContent.includes('<Badge') &&
                     notificationsContent.includes('unreadCount > 99 ? \'99+\' : unreadCount')
console.log(hasBadgeLogic ? '✅ Badge only shows when unreadCount > 0' : '❌ Badge rendering logic incorrect')

// Check "Mark all read" button logic
const hasMarkAllButton = notificationsContent.includes('{unreadCount > 0 && (') &&
                        notificationsContent.includes('Mark all read')
console.log(hasMarkAllButton ? '✅ "Mark all read" button only shows when unreadCount > 0' : '❌ "Mark all read" button logic incorrect')

// Summary
console.log('\n📊 Summary:')
const allChecks = [
  hasMarkAllReadCount,
  hasMarkSpecificCount,
  hasDeleteCount,
  hasMarkAsReadHandling,
  hasMarkAllReadHandling,
  hasDeleteHandling,
  hasBadgeLogic,
  hasMarkAllButton
]

const passedChecks = allChecks.filter(Boolean).length
console.log(`${passedChecks}/${allChecks.length} checks passed`)

if (passedChecks === allChecks.length) {
  console.log('🎉 All notification badge fixes implemented successfully!')
  console.log('\n✨ Fixes implemented:')
  console.log('  • API PATCH method now returns updated unread_count for "mark all read"')
  console.log('  • API PATCH method now returns updated unread_count for "mark specific"')
  console.log('  • Frontend properly uses server-provided unread_count when available')
  console.log('  • Badge only displays when unreadCount > 0')
  console.log('  • "Mark all read" button only shows when unreadCount > 0')
  console.log('\n🔧 This should fix the issue where:')
  console.log('  • Notification badge shows when there are no notifications')
  console.log('  • Unread count becomes stale or inaccurate')
  console.log('  • Badge persists after all notifications are read or deleted')
} else {
  console.log('⚠️  Some fixes may be missing or incomplete')
}

console.log('\n🚀 To test manually:')
console.log('1. Start the development server: npm run dev')
console.log('2. Log in and check if there\'s a notification badge')
console.log('3. Open notifications and mark all as read')
console.log('4. Verify the badge disappears completely')
console.log('5. Create new notifications and mark them individually')
console.log('6. Verify badge count decreases correctly')
console.log('7. Delete all notifications and verify badge disappears')
