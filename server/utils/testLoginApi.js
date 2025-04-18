/**
 * Test login API
 * This script tests the login API directly
 */

const http = require('http');

// User credentials to test
const credentials = {
  email: 'phitruongtrolai@yahoo.com.vn',
  password: '123456789'
};

// API endpoint options
const options = {
  hostname: '192.168.191.115',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

// Create the request
const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Response data:', JSON.stringify(parsedData, null, 2));
      
      if (res.statusCode === 200 && parsedData.success) {
        console.log('Login successful!');
      } else {
        console.log('Login failed:', parsedData.message);
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

// Send the request with the credentials
req.write(JSON.stringify(credentials));
req.end();

console.log('Login request sent to:', options.hostname + ':' + options.port + options.path);
console.log('With credentials:', JSON.stringify(credentials));