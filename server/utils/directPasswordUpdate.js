/**
 * Direct password update script
 * This script uses direct SQL queries to update a user's password
 */

const sql = require('mssql');

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

// User email to update
const userEmail = 'phitruongtrolai@yahoo.com.vn';
// New plain text password
const newPassword = '123456789';

async function updatePassword() {
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
    
    // Update the password directly with plain text
    console.log('Updating password to plain text...');
    await pool.request()
      .input('email', sql.NVarChar, userEmail)
      .input('password', sql.NVarChar, newPassword)
      .query('UPDATE Users SET password = @password WHERE email = @email');
    
    console.log('Password updated successfully');
    
    // Verify the update
    const verifyResult = await pool.request()
      .input('email', sql.NVarChar, userEmail)
      .query('SELECT password FROM Users WHERE email = @email');
    
    if (verifyResult.recordset.length > 0) {
      console.log('Updated password in database:');
      console.log(`- New password: ${verifyResult.recordset[0].password}`);
      console.log(`- Password length: ${verifyResult.recordset[0].password.length}`);
    }
    
    console.log(`User ${userEmail} can now log in with password: ${newPassword}`);
    
    await sql.close();
  } catch (error) {
    console.error('Error updating password:', error);
  }
}

// Run the function
updatePassword();