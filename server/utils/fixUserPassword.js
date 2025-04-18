/**
 * Utility script to fix a user's password
 * Run with: node utils/fixUserPassword.js
 */

const sql = require('mssql');
const bcrypt = require('bcryptjs');
const { sqlConfig } = require('../config/db');

// User email to fix
const userEmail = 'phitruongtrolai@yahoo.com.vn';
// New password to set
const newPassword = '123456789';

const fixUserPassword = async () => {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(sqlConfig);
    console.log('Connected to database');
    
    // Check if user exists
    console.log(`Checking if user with email ${userEmail} exists...`);
    const checkResult = await pool.request()
      .input('email', sql.NVarChar, userEmail)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (checkResult.recordset.length === 0) {
      console.log('User not found');
      return;
    }
    
    const user = checkResult.recordset[0];
    console.log('User found:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Username: ${user.username}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Current password type: ${typeof user.password}`);
    console.log(`- Current password length: ${user.password ? user.password.length : 0}`);
    
    // Hash the new password
    console.log('Hashing new password...');
    let hashedPassword;
    
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(newPassword, salt);
      console.log('Password hashed successfully');
    } catch (bcryptError) {
      console.error('Error hashing password:', bcryptError);
      console.log('Using plain text password as fallback');
      hashedPassword = newPassword;
    }
    
    // Update the user's password
    console.log('Updating user password...');
    await pool.request()
      .input('id', sql.Int, user.id)
      .input('password', sql.NVarChar, hashedPassword)
      .query('UPDATE Users SET password = @password, updatedAt = GETDATE() WHERE id = @id');
    
    console.log('Password updated successfully');
    console.log(`User ${userEmail} can now log in with password: ${newPassword}`);
    
    // Verify the update
    const verifyResult = await pool.request()
      .input('id', sql.Int, user.id)
      .query('SELECT password FROM Users WHERE id = @id');
    
    console.log('Updated password in database:');
    console.log(`- Type: ${typeof verifyResult.recordset[0].password}`);
    console.log(`- Length: ${verifyResult.recordset[0].password.length}`);
    console.log(`- Starts with $2: ${verifyResult.recordset[0].password.startsWith('$2')}`);
    
    await sql.close();
  } catch (error) {
    console.error('Error fixing user password:', error);
  }
};

// Run the function
fixUserPassword();