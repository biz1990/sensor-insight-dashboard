/**
 * Find login endpoint
 * This script tries to find the login endpoint
 */

const fetch = require('node-fetch');

// Base API URL
const baseUrl = 'http://192.168.190.245:3001';

// Possible login endpoints
const possibleEndpoints = [
  '/api/auth/login',
  '/api/login',
  '/api/users/login',
  '/api/user/login',
  '/login',
  '/auth/login'
];

// User credentials to test
const credentials = {
  email: 'phitruongtrolai@yahoo.com.vn',
  password: '123456789'
};

async function testEndpoint(url) {
  try {
    console.log(`Testing endpoint: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 404) {
      console.log('Endpoint not found');
      return false;
    }
    
    try {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      return true;
    } catch (jsonError) {
      console.log('Could not parse response as JSON');
      try {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      } catch (textError) {
        console.log('Could not get response text');
      }
      return false;
    }
  } catch (error) {
    console.error(`Error testing endpoint ${url}:`, error.message);
    return false;
  }
}

async function findLoginEndpoint() {
  console.log(`Looking for login endpoint on: ${baseUrl}`);
  console.log('With credentials:', credentials);
  
  for (const endpoint of possibleEndpoints) {
    console.log('\n-----------------------------------');
    const success = await testEndpoint(`${baseUrl}${endpoint}`);
    
    if (success) {
      console.log(`\nFound working login endpoint: ${baseUrl}${endpoint}`);
      return;
    }
  }
  
  console.log('\nCould not find a working login endpoint');
}

// Run the function
findLoginEndpoint();