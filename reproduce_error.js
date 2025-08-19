#!/usr/bin/env node

console.log('Starting Next.js build to reproduce the error...');

const { spawn } = require('child_process');
const path = require('path');

// Try to build the project to reproduce the webpack runtime error
const buildProcess = spawn('npm', ['run', 'build'], {
  cwd: process.cwd(),
  stdio: 'inherit'
});

buildProcess.on('close', (code) => {
  console.log(`Build process exited with code ${code}`);

  if (code === 0) {
    console.log('Build succeeded, now trying to start the server...');

    // Try to start the server
    const startProcess = spawn('npm', ['run', 'start'], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    // Kill the server after 10 seconds to see if it starts properly
    setTimeout(() => {
      startProcess.kill();
      console.log('Server test completed');
    }, 10000);

  } else {
    console.log('Build failed - this might be where the error occurs');
  }
});

buildProcess.on('error', (error) => {
  console.error('Error starting build process:', error);
});
