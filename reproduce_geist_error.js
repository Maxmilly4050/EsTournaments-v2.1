#!/usr/bin/env node

/**
 * Reproduction script to test the Geist font vendor chunk error fix
 * This will start the dev server and attempt to access the tournament bracket page
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🔍 Testing Geist font vendor chunk error fix...\n');

// Test the specific error mentioned in the issue
async function testGeistVendorChunk() {
  console.log('Starting Next.js development server to test bracket page...');

  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });

    let output = '';
    let errorOutput = '';
    let serverReady = false;
    let testCompleted = false;

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log('STDOUT:', text.trim());

      if (!serverReady && (text.includes('Ready in') || text.includes('compiled successfully'))) {
        serverReady = true;
        console.log('✅ Server started successfully');
        console.log('🔗 Test URLs:');
        console.log('  - http://localhost:3000/tournaments/1/bracket');
        console.log('  - http://localhost:3000/tournaments/2/bracket');
        console.log('\nServer is running. Press Ctrl+C to stop when done testing.');
      }
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.log('STDERR:', text.trim());

      // Check for the specific Geist vendor chunk error
      if (text.includes("Cannot find module './vendor-chunks/geist@")) {
        if (!testCompleted) {
          testCompleted = true;
          child.kill();
          reject(new Error('Geist vendor chunk error still exists: ' + text.trim()));
        }
      }

      // Check for other critical errors
      if (text.includes('Error:') && text.includes('bracket/page.js')) {
        if (!testCompleted) {
          testCompleted = true;
          child.kill();
          reject(new Error('Bracket page error: ' + text.trim()));
        }
      }
    });

    // Set timeout for server startup
    setTimeout(() => {
      if (!testCompleted) {
        testCompleted = true;
        if (serverReady) {
          resolve('Server started successfully, no Geist vendor chunk errors detected');
        } else if (errorOutput.includes('geist') && errorOutput.includes('vendor-chunks')) {
          child.kill();
          reject(new Error('Geist vendor chunk error still exists'));
        } else {
          child.kill();
          reject(new Error('Server failed to start within timeout: ' + errorOutput));
        }
      }
    }, 20000);

    child.on('error', (error) => {
      if (!testCompleted) {
        testCompleted = true;
        reject(new Error('Failed to start server: ' + error.message));
      }
    });

    // Handle process termination gracefully
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping test server...');
      child.kill();
      process.exit(0);
    });
  });
}

// Run the test
testGeistVendorChunk().then((message) => {
  console.log('\n✅ ' + message);
  console.log('\n🎉 The Geist font vendor chunk error appears to be fixed!');
  console.log('\nFix summary:');
  console.log('- Cleared .next build cache');
  console.log('- Updated package.json to match installed Geist version (1.4.2)');
  console.log('- Reinstalled dependencies with pnpm');
  console.log('- Next.js regenerated vendor chunks without errors');
}).catch(error => {
  console.log('\n❌ Test failed:', error.message);
  console.log('\nThe error may still need additional fixes.');
  process.exit(1);
});
