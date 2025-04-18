/**
 * Check API structure
 * This script checks the structure of the API
 */

const fetch = require('node-fetch');

// Base API URL
const baseUrl = 'http://192.168.190.245:3001';

// Endpoints to check
const endpoints = [
  '/api',
  '/api/auth',
  '/api/auth/login',
  '/api/users',
  '/api/devices'
];

async function checkEndpoint(url) {
  try {
    console.log(`Checking endpoint: ${url}`);
    const response = await fetch(url);
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 404) {
      console.log('Endpoint not found');
      return;
    }
    
    try {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (jsonError) {
      console.log('Could not parse response as JSON');
      try {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      } catch (textError) {
        console.log('Could not get response text');
      }
    }
  } catch (error) {
    console.error(`Error checking endpoint ${url}:`, error.message);
  }
}

async function checkApiStructure() {
  console.log(`Checking API structure for: ${baseUrl}`);
  
  for (const endpoint of endpoints) {
    console.log('\n-----------------------------------');
    await checkEndpoint(`${baseUrl}${endpoint}`);
  }
  
  // Try a POST request to the login endpoint
  console.log('\n-----------------------------------');
  console.log('Testing login endpoint with POST request...');
  
  try {
    const loginUrl = `${baseUrl}/api/auth/login`;
    const credentials = {
      email: 'phitruongtrolai@yahoo.com.vn',
      password: '123456789'
    };
    
    console.log(`POST request to: ${loginUrl}`);
    console.log('With credentials:', credentials);
    
    const response = await fetch(loginUrl, {
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
    } catch (jsonError) {
      console.log('Could not parse response as JSON');
      try {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      } catch (textError) {
        console.log('Could not get response text');
      }
    }
  } catch (error) {
    console.error('Error testing login endpoint:', error.message);
  }
}

// Run the function
checkApiStructure();