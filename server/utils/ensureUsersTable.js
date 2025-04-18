/**
 * Utility script to ensure the Users table exists
 * Run with: node utils/ensureUsersTable.js
 */

const sql = require('mssql');
const { sqlConfig } = require('../config/db');

const ensureUsersTable = async () => {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(sqlConfig);
    
    // Check if Users table exists
    const tableCheck = await pool.request().query(`
      SELECT OBJECT_ID('Users') as TableID
    `);
    
    if (tableCheck.recordset[0].TableID) {
      console.log('Users table already exists');
    } else {
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
    }
    
    await sql.close();
  } catch (error) {
    console.error('Error ensuring Users table:', error);
  }
};

// Run the function
ensureUsersTable();