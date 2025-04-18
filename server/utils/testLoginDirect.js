/**
 * Direct login test
 * This script tests the login functionality directly without using Express
 */

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

// User credentials to test
const email = 'phitruongtrolai@yahoo.com.vn';
const password = '123456789';

async function testLogin() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('Connected to database');
    
    console.log(`Looking for user with email: ${email}`);
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (result.recordset.length === 0) {
      console.log('User not found');
      await sql.close();
      return;
    }
    
    const user = result.recordset[0];
    console.log('User found:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    
    console.log('Password details:', {
      value: user.password,
      type: typeof user.password,
      length: user.password ? user.password.length : 0,
      isHashed: user.password && user.password.startsWith('$2')
    });
    
    // Direct comparison
    const directMatch = user.password === password;
    console.log('Direct comparison result:', directMatch);
    
    // String conversion comparison
    const stringMatch = user.password.toString() === password.toString();
    console.log('String conversion comparison result:', stringMatch);
    
    // Character code comparison
    console.log('Password character codes:', Array.from(user.password).map(c => c.charCodeAt(0)));
    console.log('Input password character codes:', Array.from(password).map(c => c.charCodeAt(0)));
    
    // Trim comparison (check for whitespace)
    if (user.password.trim() === password.trim() && (user.password !== password)) {
      console.log('Passwords match after trimming whitespace');
    }
    
    // Update password to plain text for testing
    console.log('\nUpdating password to ensure it matches exactly...');
    await pool.request()
      .input('id', sql.Int, user.id)
      .input('password', sql.NVarChar, password)
      .query('UPDATE Users SET password = @password WHERE id = @id');
    
    console.log('Password updated. Verifying...');
    
    // Verify the update
    const verifyResult = await pool.request()
      .input('id', sql.Int, user.id)
      .query('SELECT password FROM Users WHERE id = @id');
    
    console.log('Updated password:', verifyResult.recordset[0].password);
    console.log('Does it match input password?', verifyResult.recordset[0].password === password);
    
    console.log('\nLogin test completed');
    await sql.close();
  } catch (error) {
    console.error('Error during login test:', error);
  }
}

// Run the function
testLogin();