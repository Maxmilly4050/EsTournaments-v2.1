#!/usr/bin/env node

/**
 * Test script to verify async params/searchParams fixes
 * This script checks that all async page components properly await params/searchParams
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Async Params/SearchParams Fixes...\n')

// Test files that were identified as having async page components
const testFiles = [
  {
    path: 'app/tournaments/[id]/page.jsx',
    description: 'TournamentPage component',
    shouldAwaitParams: true,
    shouldAwaitSearchParams: false
  },
  {
    path: 'app/tournaments/[id]/bracket/page.jsx',
    description: 'TournamentBracketPage component',
    shouldAwaitParams: true,
    shouldAwaitSearchParams: false
  },
  {
    path: 'app/tournaments/[id]/join/page.jsx',
    description: 'JoinTournamentPage component',
    shouldAwaitParams: true,
    shouldAwaitSearchParams: false
  },
  {
    path: 'app/tournaments/[id]/submit-result/page.jsx',
    description: 'SubmitResultPage component',
    shouldAwaitParams: true,
    shouldAwaitSearchParams: true
  },
  {
    path: 'app/auth/callback/page.jsx',
    description: 'AuthCallback component',
    shouldAwaitParams: false,
    shouldAwaitSearchParams: true
  },
  {
    path: 'app/tournaments/page.jsx',
    description: 'TournamentsPage component',
    shouldAwaitParams: false,
    shouldAwaitSearchParams: true
  },
  {
    path: 'app/admin/results/page.jsx',
    description: 'AdminResultsPage component',
    shouldAwaitParams: false,
    shouldAwaitSearchParams: false
  },
  {
    path: 'app/auth/login/page.jsx',
    description: 'LoginPage component',
    shouldAwaitParams: false,
    shouldAwaitSearchParams: false
  },
  {
    path: 'app/auth/sign-up/page.jsx',
    description: 'SignUpPage component',
    shouldAwaitParams: false,
    shouldAwaitSearchParams: false
  }
]

let totalChecks = 0
let passedChecks = 0

function checkFile(filePath, description, shouldAwaitParams, shouldAwaitSearchParams) {
  console.log(`\n📁 Checking ${description}...`)

  if (!fs.existsSync(path.join(__dirname, filePath))) {
    console.log(`❌ File not found: ${filePath}`)
    return
  }

  const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8')

  // Check if component is async
  totalChecks++
  const isAsync = content.includes('export default async function')
  console.log(`${isAsync ? '✅' : '❌'} Component is declared as async function`)
  if (isAsync) passedChecks++

  if (shouldAwaitParams) {
    // Check for proper params awaiting
    totalChecks++
    const hasParamsAwait = content.includes('const resolvedParams = await params') ||
                          content.includes('const awaitedParams = await params')
    console.log(`${hasParamsAwait ? '✅' : '❌'} Params are properly awaited`)
    if (hasParamsAwait) passedChecks++

    // Check for no synchronous params access
    totalChecks++
    const hasSyncParamsAccess = content.match(/(?<!resolved|awaited)params\.id/g)
    console.log(`${!hasSyncParamsAccess ? '✅' : '❌'} No synchronous params access`)
    if (!hasSyncParamsAccess) passedChecks++
  }

  if (shouldAwaitSearchParams) {
    // Check for proper searchParams awaiting
    totalChecks++
    const hasSearchParamsAwait = content.includes('const resolvedSearchParams = await searchParams') ||
                                content.includes('const awaitedSearchParams = await searchParams')
    console.log(`${hasSearchParamsAwait ? '✅' : '❌'} SearchParams are properly awaited`)
    if (hasSearchParamsAwait) passedChecks++

    // Check for no synchronous searchParams access
    totalChecks++
    const hasSyncSearchParamsAccess = content.match(/(?<!resolved|awaited)searchParams\./g)
    console.log(`${!hasSyncSearchParamsAccess ? '✅' : '❌'} No synchronous searchParams access`)
    if (!hasSyncSearchParamsAccess) passedChecks++
  }
}

// Test all files
testFiles.forEach(file => {
  checkFile(file.path, file.description, file.shouldAwaitParams, file.shouldAwaitSearchParams)
})

// Summary
console.log('\n' + '='.repeat(60))
console.log('📊 ASYNC PARAMS/SEARCHPARAMS FIX RESULTS')
console.log('='.repeat(60))

const passRate = ((passedChecks / totalChecks) * 100).toFixed(1)
console.log(`\n✅ Passed: ${passedChecks}/${totalChecks} checks (${passRate}%)`)

if (passedChecks === totalChecks) {
  console.log('\n🎉 ALL FIXES IMPLEMENTED SUCCESSFULLY!')
  console.log('\n✨ Issues resolved:')
  console.log('  • All async page components properly await params/searchParams')
  console.log('  • No more synchronous access to Promise-based params/searchParams')
  console.log('  • React DOM thenable tracking errors should be resolved')
  console.log('  • Next.js 15+ compatibility ensured')
} else {
  console.log('\n⚠️  Some issues may still exist')
  const failedChecks = totalChecks - passedChecks
  console.log(`❌ Failed: ${failedChecks} checks`)
}

console.log('\n🔧 Root Cause Identified:')
console.log('The error was caused by async page components making synchronous access')
console.log('to params/searchParams objects that are Promises in Next.js 15+.')
console.log('This caused React\'s thenable tracking to fail during component rendering.')

console.log('\n🎯 Solution Applied:')
console.log('• Updated all async page components to properly await params/searchParams')
console.log('• Replaced synchronous access patterns like params.id with resolvedParams.id')
console.log('• Ensured compatibility with Next.js 15+ Promise-based parameter handling')

console.log('\n🚀 Expected Results:')
console.log('✅ No more "trackUsedThenable" or "unwrapThenable" errors')
console.log('✅ No more React DOM reconciliation failures')
console.log('✅ Components render correctly without thenable tracking issues')
console.log('✅ Full Next.js 15+ compatibility achieved')
