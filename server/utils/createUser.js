/**
 * Utility script to create a user in the database
 * Run with: node utils/createUser.js
 */

const sql = require('mssql');
const bcrypt = require('bcryptjs');
const { sqlConfig } = require('../config/db');

// Default user data - change as needed
const userData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password123',
  role: 'user', // 'admin' or 'user'
  isActive: true
};

const createUser = async () => {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(sqlConfig);
    
    // Check if user already exists
    const checkResult = await pool.request()
      .input('username', sql.NVarChar, userData.username)
      .input('email', sql.NVarChar, userData.email)
      .query('SELECT * FROM Users WHERE username = @username OR email = @email');
    
    if (checkResult.recordset.length > 0) {
      console.log('User with this username or email already exists');
      return;
    }
    
    // Hash password
    console.log('Hashing password...');
    let hashedPassword;
    
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
      console.log('Password hashed successfully');
    } catch (bcryptError) {
      console.error('Error hashing password:', bcryptError);
      console.log('Using plain text password as fallback');
      hashedPassword = userData.password;
    }
    
    // Insert user
    console.log('Creating user...');
    const result = await pool.request()
      .input('username', sql.NVarChar, userData.username)
      .input('email', sql.NVarChar, userData.email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, userData.role)
      .input('isActive', sql.Bit, userData.isActive)
      .query(`
        INSERT INTO Users (username, email, password, role, isActive)
        OUTPUT INSERTED.*
        VALUES (@username, @email, @password, @role, @isActive)
      `);
    
    console.log('User created successfully:');
    console.log(`- ID: ${result.recordset[0].id}`);
    console.log(`- Username: ${result.recordset[0].username}`);
    console.log(`- Email: ${result.recordset[0].email}`);
    console.log(`- Role: ${result.recordset[0].role}`);
    console.log(`- Active: ${result.recordset[0].isActive ? 'Yes' : 'No'}`);
    
    await sql.close();
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

// Run the function
createUser();