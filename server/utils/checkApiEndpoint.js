/**
 * Check API endpoint structure
 * This script checks the structure of the API endpoint
 */

const fetch = require('node-fetch');

// API endpoint to check
const apiUrl = 'http://192.168.190.131:3001/api';

async function checkApiEndpoint() {
  try {
    console.log(`Checking API endpoint: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    console.log(`Response status: ${response.status}`);
    
    try {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (jsonError) {
      console.log('Could not parse response as JSON');
      const text = await response.text();
      console.log('Response text:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    }
    
    // Check auth endpoint
    console.log('\nChecking auth endpoint...');
    const authResponse = await fetch(`${apiUrl}/auth`);
    console.log(`Auth endpoint status: ${authResponse.status}`);
    
    try {
      const authData = await authResponse.json();
      console.log('Auth endpoint data:', JSON.stringify(authData, null, 2));
    } catch (jsonError) {
      console.log('Could not parse auth response as JSON');
      const text = await authResponse.text();
      console.log('Auth response text:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    }
  } catch (error) {
    console.error('Error checking API endpoint:', error);
  }
}

// Run the function
checkApiEndpoint();