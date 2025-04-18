/**
 * Test login functionality
 * This script tests the login functionality directly
 */

const sql = require('mssql');
const bcrypt = require('bcryptjs');

// Database configuration - update these values to match your environment
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
const userEmail = 'phitruongtrolai@yahoo.com.vn';
const userPassword = '123456789';

async function testLogin() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('Connected to database');
    
    // First, check if the user exists
    console.log(`Looking for user with email: ${userEmail}`);
    const userCheck = await pool.request()
      .input('email', sql.NVarChar, userEmail)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (userCheck.recordset.length === 0) {
      console.log('User not found');
      await sql.close();
      return;
    }
    
    const user = userCheck.recordset[0];
    console.log('User found:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Username: ${user.username}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Password: ${user.password}`);
    console.log(`- Password type: ${typeof user.password}`);
    console.log(`- Password length: ${user.password ? user.password.length : 0}`);
    console.log(`- Is password hashed: ${user.password && user.password.startsWith('$2')}`);
    
    // Test direct password comparison
    const directMatch = userPassword === user.password;
    console.log(`Direct password comparison: ${directMatch}`);
    
    // Test string conversion comparison
    const stringMatch = userPassword.toString() === user.password.toString();
    console.log(`String conversion comparison: ${stringMatch}`);
    
    // Test bcrypt comparison if password is hashed
    if (user.password && user.password.startsWith('$2')) {
      try {
        const bcryptMatch = await bcrypt.compare(userPassword, user.password);
        console.log(`Bcrypt comparison: ${bcryptMatch}`);
      } catch (bcryptError) {
        console.error('Error during bcrypt comparison:', bcryptError);
      }
    }
    
    console.log('Login test completed');
    await sql.close();
  } catch (error) {
    console.error('Error during login test:', error);
  }
}

// Run the function
testLogin();