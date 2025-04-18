/**
 * Sensor Insight Dashboard Startup Script
 * 
 * This script starts both the API server and the frontend development server.
 */

// Use CommonJS for Node.js scripts
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

// Determine the correct npm command based on the OS
const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';

console.log('=== Starting Sensor Insight Dashboard ===\n');

// Start the API server
console.log('Starting API server...');
const serverProcess = spawn(npmCmd, ['run', 'server'], {
  stdio: 'inherit',
  shell: true
});

// Wait a moment before starting the frontend
setTimeout(() => {
  console.log('\nStarting frontend development server...');
  const frontendProcess = spawn(npmCmd, ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  // Handle frontend process events
  frontendProcess.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
    serverProcess.kill();
    process.exit(code);
  });
}, 2000);

// Handle server process events
serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle script termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  serverProcess.kill();
  process.exit(0);
});

console.log('\nPress Ctrl+C to stop all servers\n');