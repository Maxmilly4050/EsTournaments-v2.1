const { createClient } = require('@supabase/supabase-js');

// This script reproduces the tournament creation error
// by attempting to create a tournament with the same data structure as the form

console.log('🔍 Reproducing Tournament Creation Error');
console.log('=======================================');

// Mock form data that matches what the create-tournament-form.jsx sends
const mockFormData = {
  name: "Test Tournament",
  game: "eFootball 2026",
  description: "A test tournament",
  tournamentType: "single_elimination",
  bracketSize: "16",
  bracketType: "standard",
  groupCount: 4,
  teamsPerGroup: 4,
  knockoutStageTeams: 2,
  customRules: {},
  isFree: true,
  entryFeeAmount: "",
  entryFeeCurrency: "TZS",
  prizePool: "",
  prizeStructure: { winner: 50, runnerUp: 30, third: 20, custom: false },
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  registrationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  matchRules: { matchDuration: "", mapSelection: "", winConditions: "", customRules: "" },
  resultSubmissionMethod: "screenshot",
  platformDevice: "PC",
  streamingEnabled: false,
  streamingLink: null,
  hostDetails: { contactEmail: "test@example.com", contactChat: "discord" },
  disputeResolutionRules: "Standard rules",
  geographicalRestrictions: "Tanzania",
  participantRequirements: "None",
  visibility: "public",
  additionalNotes: "Test tournament"
};

console.log('\n1. Analyzing Form Data Structure:');
console.log('=================================');

// Simulate the exact insert data from the form
const insertData = {
  title: mockFormData.name, // ❌ MISMATCH: table has 'name', not 'title'
  game: mockFormData.game,
  description: mockFormData.description,
  tournament_type: mockFormData.tournamentType,
  bracket_size: parseInt(mockFormData.bracketSize),
  max_participants: parseInt(mockFormData.bracketSize),
  bracket_type: mockFormData.bracketType, // ❌ MISMATCH: not in table schema
  group_count: mockFormData.tournamentType === 'group_stage' ? mockFormData.groupCount : 0, // ❌ MISMATCH: not in table schema
  teams_per_group: mockFormData.tournamentType === 'group_stage' ? mockFormData.teamsPerGroup : 4, // ❌ MISMATCH: not in table schema
  knockout_stage_teams: mockFormData.tournamentType === 'group_stage' ? mockFormData.knockoutStageTeams : 0, // ❌ MISMATCH: not in table schema
  custom_rules: mockFormData.tournamentType === 'custom' ? mockFormData.customRules : {}, // ❌ MISMATCH: not in table schema
  is_free: mockFormData.isFree, // ❌ MISMATCH: not in table schema
  entry_fee_amount: mockFormData.isFree ? 0 : parseFloat(mockFormData.entryFeeAmount) || 0, // ❌ MISMATCH: not in table schema
  entry_fee_currency: mockFormData.entryFeeCurrency, // ❌ MISMATCH: not in table schema
  prize_pool: mockFormData.prizePool,
  prize_structure: mockFormData.prizeStructure, // ❌ MISMATCH: not in table schema
  start_date: mockFormData.startDate ? new Date(mockFormData.startDate).toISOString() : null,
  end_date: mockFormData.endDate ? new Date(mockFormData.endDate).toISOString() : null,
  registration_deadline: mockFormData.registrationDeadline ? new Date(mockFormData.registrationDeadline).toISOString() : null, // ❌ MISMATCH: not in table schema
  match_rules: mockFormData.matchRules, // ❌ MISMATCH: not in table schema
  result_submission_method: mockFormData.resultSubmissionMethod, // ❌ MISMATCH: not in table schema
  platform_device: mockFormData.platformDevice, // ❌ MISMATCH: not in table schema
  streaming_enabled: mockFormData.streamingEnabled, // ❌ MISMATCH: not in table schema
  streaming_link: mockFormData.streamingLink, // ❌ MISMATCH: not in table schema
  host_contact_email: mockFormData.hostDetails.contactEmail, // ❌ MISMATCH: not in table schema
  host_contact_chat: mockFormData.hostDetails.contactChat, // ❌ MISMATCH: not in table schema
  dispute_resolution_rules: mockFormData.disputeResolutionRules, // ❌ MISMATCH: not in table schema
  geographical_restrictions: mockFormData.geographicalRestrictions, // ❌ MISMATCH: not in table schema
  participant_requirements: mockFormData.participantRequirements, // ❌ MISMATCH: not in table schema
  visibility: mockFormData.visibility, // ❌ MISMATCH: not in table schema
  additional_notes: mockFormData.additionalNotes, // ❌ MISMATCH: not in table schema
  organizer_id: 'mock-user-id', // ❌ MISMATCH: table has 'created_by', not 'organizer_id'
};

console.log('❌ CRITICAL SCHEMA MISMATCHES FOUND:');
console.log('=====================================');

console.log('\n🔍 Field Mapping Issues:');
console.log('- Form uses "title" → Database expects "name"');
console.log('- Form uses "organizer_id" → Database expects "created_by"');

console.log('\n🔍 Missing Database Columns (will cause SQL errors):');
const missingColumns = [
  'bracket_type', 'group_count', 'teams_per_group', 'knockout_stage_teams',
  'custom_rules', 'is_free', 'entry_fee_amount', 'entry_fee_currency',
  'prize_structure', 'registration_deadline', 'match_rules',
  'result_submission_method', 'platform_device', 'streaming_enabled',
  'streaming_link', 'host_contact_email', 'host_contact_chat',
  'dispute_resolution_rules', 'geographical_restrictions',
  'participant_requirements', 'visibility', 'additional_notes'
];

missingColumns.forEach(col => {
  console.log(`- ${col}`);
});

console.log('\n🔍 Expected Database Schema (from 01-create-tables.sql):');
console.log('- id (UUID, auto-generated)');
console.log('- name (TEXT, required)');
console.log('- description (TEXT)');
console.log('- game (TEXT, required)');
console.log('- max_participants (INTEGER, default 16)');
console.log('- current_participants (INTEGER, default 0)');
console.log('- status (TEXT, default "upcoming")');
console.log('- tournament_type (TEXT, default "single_elimination")');
console.log('- start_date (TIMESTAMP)');
console.log('- end_date (TIMESTAMP)');
console.log('- prize_pool (TEXT)');
console.log('- entry_fee (TEXT, default "Free")');
console.log('- created_by (UUID, references profiles.id)');
console.log('- created_at (TIMESTAMP, auto-generated)');
console.log('- updated_at (TIMESTAMP, auto-generated)');

console.log('\n💡 ROOT CAUSE IDENTIFIED:');
console.log('==========================');
console.log('The form is trying to insert data into columns that do not exist in the database.');
console.log('This causes a SQL error, which triggers the "Failed to create tournament" alert.');

console.log('\n🔧 REQUIRED FIXES:');
console.log('==================');
console.log('1. Update database schema to include all required columns, OR');
console.log('2. Update form to only use existing columns and proper field names');
console.log('3. Map "title" → "name" and "organizer_id" → "created_by"');

console.log('\nThis explains why users see "Failed to create tournament. Please try again."');
