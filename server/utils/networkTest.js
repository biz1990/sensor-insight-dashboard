/**
 * Network Test Utility
 * 
 * This script helps test network connectivity for the Sensor Insight Dashboard.
 * It displays the server's IP addresses and tests if the server is accessible.
 */

const os = require('os');
const http = require('http');
const serverConfig = require('../../config');

// Get all network interfaces
const networkInterfaces = os.networkInterfaces();

console.log('=== Sensor Insight Dashboard Network Test ===\n');
console.log('Server Configuration:');
console.log(`- Port: ${serverConfig.port}`);
console.log(`- Host: ${serverConfig.host}`);
console.log('\nAvailable Network Interfaces:');

// Display all IP addresses
Object.keys(networkInterfaces).forEach(interfaceName => {
  const interfaces = networkInterfaces[interfaceName];
  
  interfaces.forEach(iface => {
    // Skip internal and non-IPv4 addresses
    if (iface.internal || iface.family !== 'IPv4') return;
    
    console.log(`- ${interfaceName}: ${iface.address}`);
    console.log(`  Access URL: http://${iface.address}:8080`);
    console.log(`  API URL: http://${iface.address}:${serverConfig.port}/api`);
  });
});

console.log('\nTesting API server accessibility...');

// Test if the server is running
const testServer = (host, port) => {
  return new Promise((resolve) => {
    const req = http.request({
      host,
      port,
      path: '/api',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        status: 'error',
        error: err.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'timeout',
        error: 'Request timed out'
      });
    });
    
    req.end();
  });
};

// Test localhost
(async () => {
  console.log('\nTesting localhost connection:');
  const localResult = await testServer('localhost', serverConfig.port);
  
  if (localResult.status === 200) {
    console.log('✅ API server is accessible on localhost');
  } else {
    console.log('❌ API server is NOT accessible on localhost');
    console.log('   Error:', localResult.error || `Status code: ${localResult.status}`);
    console.log('   Make sure the server is running with: npm run server');
  }
  
  console.log('\nNetwork Setup Instructions:');
  console.log('1. Make sure the server is running with: npm run server');
  console.log('2. Other computers should access the dashboard using one of the URLs listed above');
  console.log('3. If you cannot connect, check your firewall settings for ports 8080 and 3001');
  console.log('\nFor more details, see the NETWORK_SETUP.md file');
})();