/**
 * Login test script
 * This script simulates the login process
 */

const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

// Database configuration
const config = {
  user: 'user1',
  password: '12345678',
  server: '192.168.191.115',
  database: 'SensorDB',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

// Create a simple Express server
const app = express();
app.use(bodyParser.json());

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });
    
    if (!email || !password) {
      console.log('Email or password missing');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Connect to database
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('Connected to database');
    
    // Find user
    console.log(`Looking for user with email: ${email}`);
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (result.recordset.length === 0) {
      console.log('User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const user = result.recordset[0];
    console.log('User found:', {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordType: typeof user.password,
      passwordLength: user.password ? user.password.length : 0,
      isHashed: user.password && user.password.startsWith('$2')
    });
    
    // Password comparison
    let isMatch = false;
    
    // Try bcrypt first if password is hashed
    if (user.password && user.password.startsWith('$2')) {
      try {
        console.log('Attempting bcrypt comparison...');
        isMatch = await bcrypt.compare(password, user.password);
        console.log('Bcrypt comparison result:', isMatch);
      } catch (bcryptError) {
        console.error('Bcrypt comparison error:', bcryptError);
      }
    } else {
      // Direct comparison for plain text passwords
      console.log('Attempting direct comparison...');
      console.log('Input password:', password);
      console.log('Stored password:', user.password);
      isMatch = password === user.password;
      console.log('Direct comparison result:', isMatch);
      
      // Try string conversion as a fallback
      if (!isMatch) {
        console.log('Trying string conversion comparison...');
        isMatch = password.toString() === user.password.toString();
        console.log('String conversion comparison result:', isMatch);
      }
    }
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    console.log('Login successful');
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Start server
const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('');
  console.log('To test login, use:');
  console.log('curl -X POST -H "Content-Type: application/json" -d \'{"email":"phitruongtrolai@yahoo.com.vn","password":"123456789"}\' http://localhost:3003/login');
  console.log('');
  console.log('Or use a tool like Postman to send a POST request to:');
  console.log('http://localhost:3003/login');
  console.log('with JSON body:');
  console.log('{');
  console.log('  "email": "phitruongtrolai@yahoo.com.vn",');
  console.log('  "password": "123456789"');
  console.log('}');
});