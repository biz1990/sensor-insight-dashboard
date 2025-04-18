/**
 * Explore API endpoints
 * This script explores available API endpoints on the server
 */

const fetch = require('node-fetch');

// Base API URL
const baseUrl = 'http://192.168.190.245:3001';

// Common API paths to check
const commonPaths = [
  '/api',
  '/api/users',
  '/api/users/login',
  '/api/user/login',
  '/api/auth',
  '/api/auth/login',
  '/api/login',
  '/login',
  '/api/authenticate',
  '/authenticate'
];

async function checkEndpoint(url, method = 'GET', body = null) {
  try {
    console.log(`Checking ${method} ${url}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    console.log(`Response status: ${response.status}`);
    
    try {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      return { status: response.status, data };
    } catch (jsonError) {
      console.log('Could not parse response as JSON');
      try {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
        return { status: response.status, text };
      } catch (textError) {
        console.log('Could not get response text');
        return { status: response.status };
      }
    }
  } catch (error) {
    console.error(`Error checking endpoint ${url}:`, error.message);
    return { error: error.message };
  }
}

async function exploreApiEndpoints() {
  console.log(`Exploring API endpoints for: ${baseUrl}`);
  
  // First, check the base API endpoint
  console.log('\n=== Checking base API endpoint ===');
  await checkEndpoint(`${baseUrl}/api`);
  
  // Check common GET endpoints
  console.log('\n=== Checking common GET endpoints ===');
  for (const path of commonPaths) {
    console.log('\n-----------------------------------');
    await checkEndpoint(`${baseUrl}${path}`);
  }
  
  // Try to find login endpoint by testing POST requests
  console.log('\n=== Testing POST requests to find login endpoint ===');
  
  const testCredentials = {
    email: 'phitruongtrolai@yahoo.com.vn',
    password: '123456789'
  };
  
  for (const path of commonPaths) {
    console.log('\n-----------------------------------');
    await checkEndpoint(`${baseUrl}${path}`, 'POST', testCredentials);
  }
  
  // Try alternative credential formats
  console.log('\n=== Testing alternative credential formats ===');
  
  const alternativeFormats = [
    { username: 'trunghau', password: '123456789' },
    { user: 'phitruongtrolai@yahoo.com.vn', pass: '123456789' },
    { userId: 'phitruongtrolai@yahoo.com.vn', userPassword: '123456789' }
  ];
  
  for (const format of alternativeFormats) {
    console.log('\n-----------------------------------');
    console.log('Testing format:', format);
    await checkEndpoint(`${baseUrl}/api/users/login`, 'POST', format);
  }
}

// Run the function
exploreApiEndpoints();