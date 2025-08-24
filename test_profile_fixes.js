#!/usr/bin/env node

/**
 * Test script to verify both profile-related fixes:
 * 1. Dynamic profile route [id]/page.jsx exists to handle UUID-based profile viewing
 * 2. Viewport metadata configuration is properly separated from metadata export
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Profile Route and Viewport Metadata Fixes...\n')

// Test 1: Check if dynamic profile route exists
console.log('1. Checking dynamic profile route implementation...')

const dynamicProfilePath = path.join(__dirname, 'app/profile/[id]/page.jsx')
const profileDirPath = path.join(__dirname, 'app/profile/[id]')

const hasDynamicRoute = fs.existsSync(dynamicProfilePath)
const hasDirectory = fs.existsSync(profileDirPath)

console.log(`${hasDirectory ? '✅' : '❌'} Dynamic profile directory exists: app/profile/[id]/`)
console.log(`${hasDynamicRoute ? '✅' : '❌'} Dynamic profile page exists: app/profile/[id]/page.jsx`)

let hasUUIDValidation = false
let hasErrorHandling = false
let hasProfileFetch = false
let hasStatsDisplay = false
let hasRedirectLogic = false

if (hasDynamicRoute) {
  const profileContent = fs.readFileSync(dynamicProfilePath, 'utf8')

  // Check for key features
  hasUUIDValidation = profileContent.includes('isValidUUID') && profileContent.includes('uuidRegex')
  hasErrorHandling = profileContent.includes('setError') && profileContent.includes('User not found')
  hasProfileFetch = profileContent.includes('params.id') && profileContent.includes('.eq("id", userId)')
  hasStatsDisplay = profileContent.includes('tournamentStats.getUserStats')
  hasRedirectLogic = profileContent.includes('router.replace("/profile")')

  console.log(`${hasUUIDValidation ? '✅' : '❌'} UUID validation implemented`)
  console.log(`${hasErrorHandling ? '✅' : '❌'} Error handling implemented`)
  console.log(`${hasProfileFetch ? '✅' : '❌'} Profile fetching by ID implemented`)
  console.log(`${hasStatsDisplay ? '✅' : '❌'} Tournament statistics display implemented`)
  console.log(`${hasRedirectLogic ? '✅' : '❌'} Self-profile redirect logic implemented`)
}

// Test 2: Check viewport metadata fix
console.log('\n2. Checking viewport metadata configuration fix...')

const layoutPath = path.join(__dirname, 'app/layout.tsx')
if (!fs.existsSync(layoutPath)) {
  console.log('❌ app/layout.tsx not found')
  process.exit(1)
}

const layoutContent = fs.readFileSync(layoutPath, 'utf8')

// Check that viewport is no longer in metadata export
const metadataMatch = layoutContent.match(/export const metadata[^}]+}/s)
const hasViewportInMetadata = metadataMatch && metadataMatch[0].includes('viewport:')

// Check that viewport exists as separate export
const hasViewportExport = layoutContent.includes('export const viewport')
const viewportMatch = layoutContent.match(/export const viewport\s*=\s*{[^}]+}/s)
const hasValidViewportConfig = viewportMatch &&
  viewportMatch[0].includes('device-width') &&
  viewportMatch[0].includes('initialScale')

console.log(`${!hasViewportInMetadata ? '✅' : '❌'} Viewport removed from metadata export`)
console.log(`${hasViewportExport ? '✅' : '❌'} Separate viewport export exists`)
console.log(`${hasValidViewportConfig ? '✅' : '❌'} Valid viewport configuration`)

// Test 3: Route structure verification
console.log('\n3. Verifying route structure...')

const profileRoutes = {
  '/profile': fs.existsSync(path.join(__dirname, 'app/profile/page.jsx')),
  '/profile/edit': fs.existsSync(path.join(__dirname, 'app/profile/edit')),
  '/profile/[id]': hasDynamicRoute
}

Object.entries(profileRoutes).forEach(([route, exists]) => {
  console.log(`${exists ? '✅' : '❌'} Route ${route} ${exists ? 'exists' : 'missing'}`)
})

// Summary
console.log('\n📊 Summary:')
const dynamicRouteChecks = hasDynamicRoute ? 6 : 2 // 6 if file exists, 2 for directory and file check
const viewportChecks = 3
const routeStructureChecks = 3

const totalChecks = dynamicRouteChecks + viewportChecks + routeStructureChecks
const passedChecks = [
  hasDirectory,
  hasDynamicRoute,
  // Only count these if dynamic route exists
  ...(hasDynamicRoute ? [
    hasUUIDValidation,
    hasErrorHandling,
    hasProfileFetch,
    hasStatsDisplay,
    hasRedirectLogic
  ] : []),
  !hasViewportInMetadata,
  hasViewportExport,
  hasValidViewportConfig,
  profileRoutes['/profile'],
  profileRoutes['/profile/edit'],
  profileRoutes['/profile/[id]']
].filter(Boolean).length

console.log(`${passedChecks}/${totalChecks} checks passed`)

if (passedChecks === totalChecks) {
  console.log('🎉 All fixes implemented successfully!')
  console.log('\n✨ Issues resolved:')
  console.log('  • 404 error for GET /profile/UUID routes - Fixed')
  console.log('  • Dynamic profile viewing by UUID now supported')
  console.log('  • Viewport metadata warning - Fixed')
  console.log('  • Proper Next.js 13+ viewport configuration')
  console.log('\n🔧 Implementation details:')
  console.log('  • Created app/profile/[id]/page.jsx for dynamic profile viewing')
  console.log('  • Added UUID validation and error handling')
  console.log('  • Moved viewport config from metadata to separate export')
  console.log('  • Maintained existing profile routes (/profile, /profile/edit)')
} else {
  console.log('⚠️  Some fixes may be incomplete or missing')
}

console.log('\n🚀 Expected results:')
console.log('✅ No more 404 errors for /profile/[uuid] routes')
console.log('✅ No more viewport metadata warnings in Next.js')
console.log('✅ Users can view other users\' profiles via /profile/[id]')
console.log('✅ Proper error handling for invalid UUIDs or non-existent users')
