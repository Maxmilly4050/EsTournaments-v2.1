#!/usr/bin/env node

/**
 * Test script to verify notification enhancements:
 * 1. Notifications marked as read when clicked
 * 2. Room codes can be copied from notification messages
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Notification Enhancements...\n')

// Test 1: Check if the enhanced notifications component exists and has the required functionality
console.log('1. Checking notifications.jsx enhancements...')

const notificationsPath = path.join(__dirname, 'components/notifications.jsx')
if (!fs.existsSync(notificationsPath)) {
  console.log('❌ notifications.jsx not found')
  process.exit(1)
}

const notificationsContent = fs.readFileSync(notificationsPath, 'utf8')

// Check for required imports
const hasRequiredImports = notificationsContent.includes('Copy') &&
                          notificationsContent.includes('from "lucide-react"')
console.log(hasRequiredImports ? '✅ Copy icon imported' : '❌ Copy icon not imported')

// Check for state management
const hasCopyState = notificationsContent.includes('copiedCode') &&
                    notificationsContent.includes('setCopiedCode')
console.log(hasCopyState ? '✅ Copy state management added' : '❌ Copy state management missing')

// Check for helper functions
const hasExtractFunction = notificationsContent.includes('extractRoomCode')
const hasCopyFunction = notificationsContent.includes('copyRoomCode')
const hasEnhancedHandler = notificationsContent.includes('handleNotificationClick')

console.log(hasExtractFunction ? '✅ Room code extraction function added' : '❌ Room code extraction function missing')
console.log(hasCopyFunction ? '✅ Copy room code function added' : '❌ Copy room code function missing')
console.log(hasEnhancedHandler ? '✅ Enhanced click handler added' : '❌ Enhanced click handler missing')

// Check for UI enhancements
const hasCopyButton = notificationsContent.includes('<Copy className="w-3 h-3 mr-1" />') &&
                     notificationsContent.includes('Copy ${roomCode}')
const hasCopyFeedback = notificationsContent.includes('Copied!')

console.log(hasCopyButton ? '✅ Copy button with icon added' : '❌ Copy button missing')
console.log(hasCopyFeedback ? '✅ Copy feedback implemented' : '❌ Copy feedback missing')

// Test 2: Verify regex pattern for room code extraction
console.log('\n2. Testing room code extraction...')

// Simulate the extractRoomCode function
const extractRoomCode = (message) => {
  const codeMatch = message.match(/(?:room\s+)?code:?\s*(\w+)/i)
  return codeMatch ? codeMatch[1] : null
}

// Test cases based on the screenshot format
const testMessages = [
  'Fau Lata has shared the match room code: 766666. Please join the match room to play.',
  'Match room code: ABC123 has been shared',
  'Your room code 999999 is ready',
  'The code: XYZ789 for your match',
  'No code in this message',
  'Match code HELLO123 without colon'
]

testMessages.forEach((message, index) => {
  const code = extractRoomCode(message)
  console.log(`  Test ${index + 1}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`)
  console.log(`    → Extracted code: ${code || 'None'}`)
})

// Test 3: Check click handler logic
console.log('\n3. Checking enhanced click handler implementation...')

const hasClickLogic = notificationsContent.includes('handleNotificationClick') &&
                     notificationsContent.includes('markAsRead([notification.id])') &&
                     notificationsContent.includes('extractRoomCode(notification.message)')

console.log(hasClickLogic ? '✅ Enhanced click handler properly implemented' : '❌ Click handler implementation issues')

// Test 4: Check for proper event handling
const hasEventHandling = notificationsContent.includes('e.stopPropagation()') &&
                        notificationsContent.includes('event.target.closest(\'button\')')

console.log(hasEventHandling ? '✅ Proper event handling implemented' : '❌ Event handling issues')

// Summary
console.log('\n📊 Summary:')
const allChecks = [
  hasRequiredImports,
  hasCopyState,
  hasExtractFunction,
  hasCopyFunction,
  hasEnhancedHandler,
  hasCopyButton,
  hasCopyFeedback,
  hasClickLogic,
  hasEventHandling
]

const passedChecks = allChecks.filter(Boolean).length
console.log(`${passedChecks}/${allChecks.length} checks passed`)

if (passedChecks === allChecks.length) {
  console.log('🎉 All notification enhancements implemented successfully!')
  console.log('\n✨ Features implemented:')
  console.log('  • Notifications are marked as read when clicked')
  console.log('  • Room codes are automatically detected in messages')
  console.log('  • Copy button appears for notifications with room codes')
  console.log('  • Visual feedback shows "Copied!" when code is copied')
  console.log('  • Proper event handling prevents conflicts')
} else {
  console.log('⚠️  Some enhancements may be missing or incomplete')
}

console.log('\n🚀 To test manually:')
console.log('1. Start the development server: npm run dev')
console.log('2. Log in and look for notifications with match room codes')
console.log('3. Click on notifications to verify they are marked as read')
console.log('4. Click the "Copy" button next to room codes')
console.log('5. Verify the clipboard contains the room code')
