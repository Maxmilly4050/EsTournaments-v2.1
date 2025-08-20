#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Next.js development server to reproduce SSR error...');

const nextDev = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname),
  stdio: 'pipe',
  shell: true
});

let errorFound = false;
let errorDetails = '';

nextDev.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('STDOUT:', output);

  if (output.includes('Ready') || output.includes('ready')) {
    console.log('\n✓ Server started, now making request to trigger SSR error...');

    // Make a request to the home page to trigger SSR
    setTimeout(() => {
      const http = require('http');
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET'
      }, (res) => {
        console.log('Response status:', res.statusCode);
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.log('Response body:', body);
          }
          process.exit(0);
        });
      });

      req.on('error', (err) => {
        console.error('Request error:', err.message);
        process.exit(1);
      });

      req.setTimeout(10000, () => {
        console.log('Request timeout');
        process.exit(1);
      });

      req.end();
    }, 2000);
  }
});

nextDev.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('STDERR:', output);

  if (output.includes('Element type is invalid') || output.includes('undefined')) {
    errorFound = true;
    errorDetails += output;
  }
});

nextDev.on('close', (code) => {
  if (errorFound) {
    console.log('\n=== SSR ERROR FOUND ===');
    console.log(errorDetails);
  } else {
    console.log(`\nProcess exited with code ${code}`);
  }
});

// Kill the process after 30 seconds
setTimeout(() => {
  console.log('\nTimeout reached, killing process...');
  nextDev.kill();
  process.exit(1);
}, 30000);
