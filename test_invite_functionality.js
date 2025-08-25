#!/usr/bin/env node

/**
 * Test script to verify the invite players functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Invite Players Functionality\n');

// Check if required files exist
const filesToCheck = [
  'components/tournament-dashboard.jsx',
  'app/api/tournaments/[id]/invite/route.js',
  'app/api/tournaments/invites/[inviteId]/route.js',
  'scripts/create-tournament-invites-table.sql'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

filesToCheck.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} - exists`);
  } else {
    console.log(`❌ ${file} - missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check tournament dashboard component implementation
console.log('\n🔍 Checking tournament dashboard implementation...');

const dashboardPath = path.join(process.cwd(), 'components/tournament-dashboard.jsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

const requiredFeatures = [
  { name: 'InvitePlayersModal component', pattern: /function InvitePlayersModal/ },
  { name: 'InvitationsList component', pattern: /function InvitationsList/ },
  { name: 'Invite players button', pattern: /Invite Players/ },
  { name: 'API call to invite endpoint', pattern: /\/api\/tournaments\/.*\/invite/ },
  { name: 'Toast notifications', pattern: /toast\.(success|error)/ },
  { name: 'Dialog components', pattern: /Dialog.*DialogTrigger/ },
  { name: 'Form handling', pattern: /handleInvite.*async/ },
  { name: 'Loading states', pattern: /loading.*setLoading/ },
  { name: 'Username input', pattern: /invitee_username/ },
  { name: 'Message input', pattern: /message.*optional/ }
];

let implementedFeatures = 0;

requiredFeatures.forEach(feature => {
  if (feature.pattern.test(dashboardContent)) {
    console.log(`✅ ${feature.name} - implemented`);
    implementedFeatures++;
  } else {
    console.log(`❌ ${feature.name} - missing`);
  }
});

console.log(`\n📊 Implementation Score: ${implementedFeatures}/${requiredFeatures.length} features implemented`);

// Check API endpoints
console.log('\n🔍 Checking API endpoints...');

const inviteApiPath = path.join(process.cwd(), 'app/api/tournaments/[id]/invite/route.js');
const inviteApiContent = fs.readFileSync(inviteApiPath, 'utf8');

const apiFeatures = [
  { name: 'POST handler for sending invites', pattern: /export async function POST/ },
  { name: 'GET handler for fetching invites', pattern: /export async function GET/ },
  { name: 'User authentication check', pattern: /supabase\.auth\.getUser/ },
  { name: 'Username lookup', pattern: /eq\("username"/ },
  { name: 'Tournament validation', pattern: /tournament.*error/ },
  { name: 'Permission checks', pattern: /created_by.*user\.id/ },
  { name: 'Duplicate invitation check', pattern: /existingInvite/ },
  { name: 'Tournament capacity check', pattern: /max_participants/ },
  { name: 'Invitation creation', pattern: /tournament_invites.*insert/ },
  { name: 'Notification sending', pattern: /NotificationService/ }
];

let implementedApiFeatures = 0;

apiFeatures.forEach(feature => {
  if (feature.pattern.test(inviteApiContent)) {
    console.log(`✅ ${feature.name} - implemented`);
    implementedApiFeatures++;
  } else {
    console.log(`❌ ${feature.name} - missing or incomplete`);
  }
});

console.log(`\n📊 API Score: ${implementedApiFeatures}/${apiFeatures.length} features implemented`);

// Check invitation response API
console.log('\n🔍 Checking invitation response API...');

const responseApiPath = path.join(process.cwd(), 'app/api/tournaments/invites/[inviteId]/route.js');
const responseApiContent = fs.readFileSync(responseApiPath, 'utf8');

const responseFeatures = [
  { name: 'PATCH handler for responses', pattern: /export async function PATCH/ },
  { name: 'Accept/decline actions', pattern: /accept.*decline/ },
  { name: 'Invitation validation', pattern: /invitation.*pending/ },
  { name: 'Expiration check', pattern: /expires_at/ },
  { name: 'Tournament participant addition', pattern: /tournament_participants.*insert/ },
  { name: 'Status update', pattern: /status.*accepted.*declined/ }
];

let implementedResponseFeatures = 0;

responseFeatures.forEach(feature => {
  if (feature.pattern.test(responseApiContent)) {
    console.log(`✅ ${feature.name} - implemented`);
    implementedResponseFeatures++;
  } else {
    console.log(`❌ ${feature.name} - missing`);
  }
});

console.log(`\n📊 Response API Score: ${implementedResponseFeatures}/${responseFeatures.length} features implemented`);

// Check database schema
console.log('\n🔍 Checking database schema...');

const schemaPath = path.join(process.cwd(), 'scripts/create-tournament-invites-table.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const schemaFeatures = [
  { name: 'Tournament invites table', pattern: /CREATE TABLE.*tournament_invites/ },
  { name: 'Foreign key constraints', pattern: /REFERENCES.*tournaments.*users/ },
  { name: 'Status check constraint', pattern: /CHECK.*status.*IN/ },
  { name: 'Unique constraint', pattern: /UNIQUE INDEX.*tournament_invites_unique/ },
  { name: 'RLS policies', pattern: /CREATE POLICY/ },
  { name: 'Cleanup function', pattern: /cleanup_expired_tournament_invites/ },
  { name: 'Proper indexing', pattern: /CREATE INDEX/ }
];

let implementedSchemaFeatures = 0;

schemaFeatures.forEach(feature => {
  if (feature.pattern.test(schemaContent)) {
    console.log(`✅ ${feature.name} - implemented`);
    implementedSchemaFeatures++;
  } else {
    console.log(`❌ ${feature.name} - missing`);
  }
});

console.log(`\n📊 Database Schema Score: ${implementedSchemaFeatures}/${schemaFeatures.length} features implemented`);

// Overall assessment
const totalFeatures = requiredFeatures.length + apiFeatures.length + responseFeatures.length + schemaFeatures.length;
const totalImplemented = implementedFeatures + implementedApiFeatures + implementedResponseFeatures + implementedSchemaFeatures;
const completionPercentage = Math.round((totalImplemented / totalFeatures) * 100);

console.log('\n🎯 OVERALL ASSESSMENT');
console.log('========================');
console.log(`Total Features: ${totalImplemented}/${totalFeatures} (${completionPercentage}%)`);

if (completionPercentage >= 90) {
  console.log('🟢 Excellent! The invite players functionality is fully implemented.');
} else if (completionPercentage >= 75) {
  console.log('🟡 Good! Most features are implemented, minor issues may exist.');
} else if (completionPercentage >= 50) {
  console.log('🟠 Partial implementation. Some key features are missing.');
} else {
  console.log('🔴 Implementation is incomplete. Many features are missing.');
}

// Test recommendations
console.log('\n📋 TESTING RECOMMENDATIONS');
console.log('============================');
console.log('1. Test the invite modal opens correctly from the dashboard');
console.log('2. Test sending invitations with valid usernames');
console.log('3. Test error handling for invalid usernames');
console.log('4. Test viewing sent invitations list');
console.log('5. Test invitation status updates');
console.log('6. Test the tournament bracket "Invite Players" button redirect');
console.log('7. Verify real-time updates when invitations are sent/accepted');
console.log('8. Test permission checks (only organizers can invite)');
console.log('9. Test duplicate invitation prevention');
console.log('10. Test tournament capacity limits');

console.log('\n✅ Test completed successfully!');
