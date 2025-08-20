#!/usr/bin/env node

/**
 * Fix for match result reporting API route
 * The current API expects columns that don't match the database schema
 */

console.log("=== Fixing Match Result Reporting API ===");

const originalApiCode = `
// Current problematic code in report-result/route.js (lines 60-79)
const { data: matchResult, error: resultError } = await supabase
  .from('match_results')
  .insert({
    match_id: matchId,
    reported_by: user.id,      // ❌ Column doesn't exist
    result_data: {             // ❌ Column doesn't exist  
      winner_id,
      player1_score,
      player2_score,
      notes
    },
    screenshot_url,
    verified: isOrganizer      // ❌ Column doesn't exist
  })
  .select()
  .single()
`;

const fixedApiCode = `
// FIXED code that matches the actual database schema
const { data: matchResult, error: resultError } = await supabase
  .from('match_results')
  .insert({
    match_id: matchId,
    submitted_by: user.id,     // ✅ Matches schema
    winner_id: winner_id,      // ✅ Matches schema
    player1_score: player1_score || 0,  // ✅ Matches schema
    player2_score: player2_score || 0,  // ✅ Matches schema
    screenshot_urls: screenshot_url ? [screenshot_url] : [], // ✅ Matches schema (array)
    notes: notes,              // ✅ Matches schema
    status: isOrganizer ? 'approved' : 'pending'  // ✅ Matches schema
  })
  .select()
  .single()
`;

console.log("=== Original Problematic Code ===");
console.log(originalApiCode);

console.log("=== Fixed Code ===");
console.log(fixedApiCode);

console.log("=== Database Schema Analysis ===");
console.log("The actual match_results table structure (from scripts/11-add-match-result-system.sql):");
console.log(`
CREATE TABLE match_results (
  id SERIAL PRIMARY KEY,
  match_id INTEGER,
  submitted_by UUID,           -- NOT 'reported_by'
  winner_id UUID,              -- Direct column, not in result_data
  player1_score INTEGER,       -- Direct column, not in result_data
  player2_score INTEGER,       -- Direct column, not in result_data
  screenshot_urls TEXT[],      -- Array of URLs, not single screenshot_url
  notes TEXT,                  -- Direct column, not in result_data
  status TEXT DEFAULT 'pending', -- NOT 'verified' boolean
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID
);
`);

console.log("=== Key Changes Needed ===");
console.log("1. Change 'reported_by' to 'submitted_by'");
console.log("2. Remove 'result_data' wrapper - use direct columns");
console.log("3. Change 'verified' boolean to 'status' text");
console.log("4. Change 'screenshot_url' to 'screenshot_urls' array");
console.log("5. Update all related query operations to match schema");

console.log("\n=== Additional API Route Fixes Needed ===");
console.log("• Update the PATCH route for result verification");
console.log("• Update any SELECT queries that reference old column names");
console.log("• Update error handling to match new schema");
console.log("• Test with the corrected column structure");

// Generate the complete fixed API route file
const fixedRouteFileContent = `import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { TournamentBracketGenerator } from '@/lib/tournament/bracket-generator'

export async function POST(request, { params }) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { id: matchId } = params
    const body = await request.json()

    const { winner_id, player1_score = 0, player2_score = 0, screenshot_url, notes } = body

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(\`
        *,
        tournaments (
          id,
          organizer_id,
          tournament_type,
          status
        )
      \`)
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Check if match is already completed
    if (match.status === 'completed') {
      return NextResponse.json({ error: 'Match already completed' }, { status: 400 })
    }

    // Validate permissions (participant or tournament organizer)
    const isParticipant = match.player1_id === user.id || match.player2_id === user.id
    const isOrganizer = match.tournaments.organizer_id === user.id

    if (!isParticipant && !isOrganizer) {
      return NextResponse.json({
        error: 'Only match participants or tournament organizer can report results'
      }, { status: 403 })
    }

    // Validate winner_id
    if (winner_id && winner_id !== match.player1_id && winner_id !== match.player2_id) {
      return NextResponse.json({ error: 'Invalid winner ID' }, { status: 400 })
    }

    // Create match result record - FIXED to match database schema
    const { data: matchResult, error: resultError } = await supabase
      .from('match_results')
      .insert({
        match_id: matchId,
        submitted_by: user.id,        // ✅ Correct column name
        winner_id: winner_id,         // ✅ Direct column
        player1_score: player1_score || 0,  // ✅ Direct column
        player2_score: player2_score || 0,  // ✅ Direct column
        screenshot_urls: screenshot_url ? [screenshot_url] : [], // ✅ Array format
        notes: notes || '',           // ✅ Direct column
        status: isOrganizer ? 'approved' : 'pending'  // ✅ Correct status format
      })
      .select()
      .single()

    if (resultError) {
      console.error('Database error:', resultError)
      return NextResponse.json({ 
        error: 'Failed to save match result',
        details: resultError.message 
      }, { status: 500 })
    }

    // If reported by organizer, update match and progress tournament
    if (isOrganizer) {
      const bracketGenerator = new TournamentBracketGenerator()

      // Update match with result and scores
      await supabase
        .from('matches')
        .update({
          winner_id,
          player1_score,
          player2_score,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId)

      // Progress tournament bracket
      await bracketGenerator.updateBracketProgression(matchId, winner_id)

      return NextResponse.json({
        success: true,
        message: 'Match result reported and tournament progressed',
        data: {
          match_id: matchId,
          result_id: matchResult.id,
          winner_id,
          status: 'approved'
        }
      })
    } else {
      // For participant reports, require verification
      return NextResponse.json({
        success: true,
        message: 'Match result reported. Awaiting organizer verification.',
        data: {
          match_id: matchId,
          result_id: matchResult.id,
          winner_id,
          status: 'pending'
        }
      })
    }

  } catch (error) {
    console.error('Error reporting match result:', error)
    return NextResponse.json({
      error: 'Failed to report match result',
      details: error.message
    }, { status: 500 })
  }
}`;

console.log("\n=== Complete Fixed API Route ===");
console.log("This can be used to replace the current route.js file:");
console.log("File: app/api/tournaments/matches/[id]/report-result/route.js");
console.log("\nThe key fixes:");
console.log("• Uses 'submitted_by' instead of 'reported_by'");
console.log("• Uses direct columns instead of 'result_data' wrapper");
console.log("• Uses 'status' instead of 'verified' boolean");
console.log("• Uses 'screenshot_urls' array instead of single 'screenshot_url'");
console.log("• Includes proper error handling and logging");
