/**
 * Setup script for authentication
 * - Ensures Users table exists
 * - Creates default admin user
 * 
 * Run with: node utils/setupAuth.js
 */

const sql = require('mssql');
const bcrypt = require('bcryptjs');
const { sqlConfig } = require('../config/db');

const setupAuth = async () => {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(sqlConfig);
    
    // Step 1: Check if Users table exists
    console.log('Checking if Users table exists...');
    const tableCheck = await pool.request().query(`
      SELECT OBJECT_ID('Users') as TableID
    `);
    
    if (!tableCheck.recordset[0].TableID) {
      console.log('Users table does not exist. Creating...');
      
      // Create Users table
      await pool.request().query(`
        CREATE TABLE Users (
          id INT PRIMARY KEY IDENTITY(1,1),
          username NVARCHAR(50) NOT NULL UNIQUE,
          email NVARCHAR(100) NOT NULL UNIQUE,
          password NVARCHAR(255) NOT NULL,
          role NVARCHAR(20) DEFAULT 'user',
          isActive BIT DEFAULT 1,
          createdAt DATETIME DEFAULT GETDATE(),
          updatedAt DATETIME DEFAULT GETDATE()
        )
      `);
      
      console.log('Users table created successfully');
    } else {
      console.log('Users table already exists');
    }
    
    // Step 2: Check if admin user exists
    console.log('Checking if admin user exists...');
    const adminCheck = await pool.request()
      .query("SELECT COUNT(*) as count FROM Users WHERE role = 'admin'");
    
    if (adminCheck.recordset[0].count === 0) {
      console.log('No admin users found. Creating default admin user...');
      
      // Create default admin
      let hashedPassword;
      
      try {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash('admin123', salt);
        console.log('Password hashed successfully');
      } catch (bcryptError) {
        console.error('Error hashing password:', bcryptError);
        console.log('Using plain text password as fallback');
        hashedPassword = 'admin123';
      }
      
      await pool.request()
        .input('username', sql.NVarChar, 'admin')
        .input('email', sql.NVarChar, 'admin@example.com')
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, 'admin')
        .input('isActive', sql.Bit, true)
        .query(`
          INSERT INTO Users (username, email, password, role, isActive)
          VALUES (@username, @email, @password, @role, @isActive)
        `);
      
      console.log('Default admin user created successfully');
      console.log('Username: admin');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists');
    }
    
    // Step 3: Create a test user if needed
    console.log('Checking if test user exists...');
    const testUserCheck = await pool.request()
      .input('email', sql.NVarChar, 'test@example.com')
      .query("SELECT COUNT(*) as count FROM Users WHERE email = @email");
    
    if (testUserCheck.recordset[0].count === 0) {
      console.log('Creating test user...');
      
      let hashedPassword;
      
      try {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash('Test123', salt);
        console.log('Password hashed successfully');
      } catch (bcryptError) {
        console.error('Error hashing password:', bcryptError);
        console.log('Using plain text password as fallback');
        hashedPassword = 'Test123';
      }
      
      await pool.request()
        .input('username', sql.NVarChar, 'testuser')
        .input('email', sql.NVarChar, 'test@example.com')
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, 'user')
        .input('isActive', sql.Bit, true)
        .query(`
          INSERT INTO Users (username, email, password, role, isActive)
          VALUES (@username, @email, @password, @role, @isActive)
        `);
      
      console.log('Test user created successfully');
      console.log('Username: testuser');
      console.log('Email: test@example.com');
      console.log('Password: Test123');
    } else {
      console.log('Test user already exists');
    }
    
    console.log('Authentication setup completed successfully');
    await sql.close();
  } catch (error) {
    console.error('Error during authentication setup:', error);
  }
};

// Run the function
setupAuth();