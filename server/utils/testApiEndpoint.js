/**
 * Test API endpoint
 * This script tests the login API endpoint directly
 */

const fetch = require('node-fetch');

// API endpoint
const apiUrl = 'http://localhost:3001/api/auth/login';

// User credentials to test
const credentials = {
  email: 'phitruongtrolai@yahoo.com.vn',
  password: '123456789'
};

async function testApiEndpoint() {
  try {
    console.log(`Testing login API endpoint: ${apiUrl}`);
    console.log(`With credentials: ${JSON.stringify(credentials)}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    console.log(`Response status: ${response.status}`);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('Login successful!');
    } else {
      console.log('Login failed:', data.message);
    }
  } catch (error) {
    console.error('Error testing API endpoint:', error);
  }
}

// Run the function
testApiEndpoint();