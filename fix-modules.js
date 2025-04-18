/**
 * Fix Module Type Script
 * 
 * This script creates separate package.json files for the server and client
 * to handle different module types.
 */

const fs = require('fs');
const path = require('path');

console.log('Fixing module type issues...');

// Create server package.json with CommonJS
const serverPackageJson = {
  "name": "sensor-insight-dashboard-server",
  "version": "1.0.0",
  "type": "commonjs",
  "private": true
};

// Write server package.json
fs.writeFileSync(
  path.join(__dirname, 'server', 'package.json'),
  JSON.stringify(serverPackageJson, null, 2)
);

console.log('Created server/package.json with CommonJS module type');

// Update main package.json to use ES modules for Vite
const mainPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
mainPackageJson.type = 'module';

fs.writeFileSync(
  path.join(__dirname, 'package.json'),
  JSON.stringify(mainPackageJson, null, 2)
);

console.log('Updated main package.json to use ES modules');

// Create a simple script to run both servers
const startScript = `
@echo off
echo Starting Sensor Insight Dashboard...

echo Starting API server...
start cmd /k "cd server && node server.js"

echo Starting frontend...
start cmd /k "npm run dev"

echo.
echo Dashboard started! Access it at http://localhost:8080
echo.
echo Press Ctrl+C in each window to stop the servers
`;

fs.writeFileSync(
  path.join(__dirname, 'start-windows.bat'),
  startScript
);

console.log('Created start-windows.bat for easy startup');

console.log('Module type issues fixed. You can now run:');
console.log('- npm run dev (for frontend only)');
console.log('- cd server && node server.js (for server only)');
console.log('- start-windows.bat (for both on Windows)');