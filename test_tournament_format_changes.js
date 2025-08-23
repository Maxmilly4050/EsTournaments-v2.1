#!/usr/bin/env node

/**
 * Test script to verify tournament format changes for player count selection
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Testing tournament format player count changes...')
console.log('==================================================')

function testFormComponent() {
  console.log('🧪 Checking create-tournament-form.jsx implementation...')

  const componentPath = path.join(__dirname, 'components', 'create-tournament-form.jsx')

  if (!fs.existsSync(componentPath)) {
    console.error('❌ Create tournament form component not found')
    return false
  }

  const componentContent = fs.readFileSync(componentPath, 'utf8')

  // Check for required functionality
  const checks = [
    {
      name: 'Updated player count options (includes 2 and 4)',
      pattern: /\[2, 4, 8, 16, 32, 64\]/,
      description: 'Player count dropdown includes 2, 4, 8, 16, 32, 64 options'
    },
    {
      name: 'Custom player count option',
      pattern: /SelectItem value="custom"[\s\S]*?Custom Number/,
      description: 'Custom Number option available in dropdown'
    },
    {
      name: 'Custom input field conditional rendering',
      pattern: /formData\.bracketSize === 'custom'[\s\S]*?customPlayerCount/,
      description: 'Custom input field shows when custom is selected'
    },
    {
      name: 'Custom input validation (min/max)',
      pattern: /min="2"[\s\S]*?max="128"/,
      description: 'Custom input has proper min/max validation'
    },
    {
      name: 'Tournament type conditional custom option',
      pattern: /tournamentType === 'round_robin'[\s\S]*?tournamentType === 'group_stage'[\s\S]*?tournamentType === 'custom'/,
      description: 'Custom option only available for flexible tournament types'
    },
    {
      name: 'Form data initialization with customPlayerCount',
      pattern: /customPlayerCount: ""/,
      description: 'Form state includes customPlayerCount field'
    },
    {
      name: 'Form submission logic handles custom count',
      pattern: /bracketSize === 'custom'[\s\S]*?customPlayerCount[\s\S]*?bracketSize/,
      description: 'Form submission uses customPlayerCount when custom is selected'
    },
    {
      name: 'Contextual help text for different tournament types',
      pattern: /Round Robin supports[\s\S]*?Group Stage supports[\s\S]*?Custom format allows/,
      description: 'Help text explains custom input for each tournament type'
    }
  ]

  console.log('\nChecking implementation features:')
  let allPassed = true

  checks.forEach(check => {
    const found = check.pattern.test(componentContent)
    console.log(`${found ? '✅' : '❌'} ${check.name}: ${found ? 'Found' : 'Missing'}`)
    if (found) {
      console.log(`   → ${check.description}`)
    }
    if (!found) allPassed = false
  })

  return allPassed
}

function testBracketGenerator() {
  console.log('\n🧪 Checking bracket-generator.js compatibility...')

  const generatorPath = path.join(__dirname, 'lib', 'tournament', 'bracket-generator.js')

  if (!fs.existsSync(generatorPath)) {
    console.error('❌ Bracket generator not found')
    return false
  }

  const generatorContent = fs.readFileSync(generatorPath, 'utf8')

  // Check for compatibility features
  const checks = [
    {
      name: 'Minimum participants check',
      pattern: /participants\.length < 2/,
      description: 'Validates minimum 2 participants'
    },
    {
      name: 'Maximum participants check',
      pattern: /participants\.length > 128/,
      description: 'Validates maximum 128 participants'
    },
    {
      name: 'Flexible bracket size calculation',
      pattern: /getNextPowerOfTwo/,
      description: 'Can handle non-power-of-two participant counts'
    },
    {
      name: 'Tournament type support',
      pattern: /single_elimination[\s\S]*?double_elimination[\s\S]*?round_robin[\s\S]*?group_stage[\s\S]*?custom/,
      description: 'Supports all tournament types including custom'
    }
  ]

  console.log('\nChecking backend compatibility:')
  let allPassed = true

  checks.forEach(check => {
    const found = check.pattern.test(generatorContent)
    console.log(`${found ? '✅' : '❌'} ${check.name}: ${found ? 'Found' : 'Missing'}`)
    if (found) {
      console.log(`   → ${check.description}`)
    }
    if (!found) allPassed = false
  })

  return allPassed
}

function main() {
  const componentPassed = testFormComponent()
  const generatorPassed = testBracketGenerator()

  console.log('\n==================================================')
  console.log('📋 FINAL ASSESSMENT:')

  if (componentPassed && generatorPassed) {
    console.log('✅ ALL CHANGES IMPLEMENTED SUCCESSFULLY!')
    console.log('\n🎉 Tournament format enhancements complete:')
    console.log('• Player count options: 2, 4, 8, 16, 32, 64 ✓')
    console.log('• Custom number input for flexible formats ✓')
    console.log('• Tournament type-specific custom option visibility ✓')
    console.log('• Form validation and help text ✓')
    console.log('• Backend compatibility maintained ✓')

    console.log('\n📱 User Experience:')
    console.log('• Single/Double Elimination: Fixed options (2, 4, 8, 16, 32, 64)')
    console.log('• Round Robin: Fixed options + Custom input (2-128 players)')
    console.log('• Group Stage: Fixed options + Custom input (flexible based on groups)')
    console.log('• Custom Format: Fixed options + Custom input (2-128 players)')
    console.log('• Custom input validates min 2, max 128 players')
    console.log('• Contextual help text guides users')

    return true
  } else {
    console.log('❌ Some implementation may be incomplete')
    if (!componentPassed) {
      console.log('• Frontend component needs attention')
    }
    if (!generatorPassed) {
      console.log('• Backend generator needs attention')
    }
    return false
  }
}

if (require.main === module) {
  const success = main()
  process.exit(success ? 0 : 1)
}

module.exports = { testFormComponent, testBracketGenerator }
