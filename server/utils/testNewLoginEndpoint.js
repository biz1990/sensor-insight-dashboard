/**
 * Test new login endpoint
 * This script tests the new login endpoint
 */

const fetch = require('node-fetch');

// User credentials to test
const credentials = {
  email: 'phitruongtrolai@yahoo.com.vn',
  password: '123456789'
};

// API endpoint
const apiUrl = 'http://localhost:3001/api/login';

async function testLoginEndpoint() {
  try {
    console.log(`Testing login endpoint: ${apiUrl}`);
    console.log(`With credentials: ${JSON.stringify(credentials)}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    console.log(`Response status: ${response.status}`);
    
    try {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok && data.success) {
        console.log('Login successful!');
        console.log('User:', data.data.user);
        console.log('Token:', data.data.token.substring(0, 20) + '...');
      } else {
        console.log('Login failed:', data.message);
      }
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      try {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      } catch (textError) {
        console.log('Could not get response text');
      }
    }
  } catch (error) {
    console.error('Error testing login endpoint:', error);
  }
}

// Run the function
testLoginEndpoint();