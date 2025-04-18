/**
 * Test login with fetch
 * This script tests the login API using fetch
 */

const fetch = require('node-fetch');

// User credentials to test
const credentials = {
  email: 'phitruongtrolai@yahoo.com.vn',
  password: '123456789'
};

// API endpoints to try
const endpoints = [
  'http://localhost:3001/api/auth/login',
  'http://127.0.0.1:3001/api/auth/login',
  'http://192.168.191.115:3001/api/auth/login',
  'http://192.168.190.245:3001/api/auth/login'
];

async function testLogin() {
  console.log('Testing login with credentials:', credentials);
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTrying endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        timeout: 5000 // 5 second timeout
      });
      
      console.log(`Response status: ${response.status}`);
      
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok && data.success) {
        console.log('Login successful!');
        console.log('User:', data.data.user);
        console.log('Token:', data.data.token.substring(0, 20) + '...');
      } else {
        console.log('Login failed:', data.message);
      }
    } catch (error) {
      console.error(`Error with endpoint ${endpoint}:`, error.message);
    }
  }
}

// Run the function
testLogin();