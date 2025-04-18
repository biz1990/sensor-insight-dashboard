/**
 * Check database schema
 * This script checks the schema of the Users table
 */

const sql = require('mssql');

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

async function checkSchema() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('Connected to database');
    
    // Check if Users table exists
    console.log('Checking if Users table exists...');
    const tableCheck = await pool.request().query(`
      SELECT OBJECT_ID('Users') as TableID
    `);
    
    if (!tableCheck.recordset[0].TableID) {
      console.log('Users table does not exist');
      await sql.close();
      return;
    }
    
    console.log('Users table exists');
    
    // Get table schema
    console.log('Getting Users table schema...');
    const schemaResult = await pool.request().query(`
      SELECT 
        c.name as ColumnName,
        t.name as DataType,
        c.max_length as MaxLength,
        c.is_nullable as IsNullable,
        c.is_identity as IsIdentity,
        CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END as IsPrimaryKey
      FROM 
        sys.columns c
      JOIN 
        sys.types t ON c.user_type_id = t.user_type_id
      LEFT JOIN 
        (SELECT i.object_id, ic.column_id
         FROM sys.indexes i
         JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
         WHERE i.is_primary_key = 1) pk 
        ON c.object_id = pk.object_id AND c.column_id = pk.column_id
      WHERE 
        c.object_id = OBJECT_ID('Users')
      ORDER BY 
        c.column_id
    `);
    
    console.log('Users table schema:');
    schemaResult.recordset.forEach(column => {
      console.log(`- ${column.ColumnName} (${column.DataType}${column.MaxLength !== -1 ? `(${column.MaxLength})` : ''}, ${column.IsNullable ? 'NULL' : 'NOT NULL'}${column.IsPrimaryKey ? ', PRIMARY KEY' : ''}${column.IsIdentity ? ', IDENTITY' : ''})`);
    });
    
    // Get sample data
    console.log('\nGetting sample data...');
    const dataResult = await pool.request().query(`
      SELECT TOP 5 * FROM Users
    `);
    
    console.log('Sample data:');
    dataResult.recordset.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Password type: ${typeof user.password}, Password length: ${user.password ? user.password.length : 0}`);
    });
    
    // Check for the specific user
    console.log('\nChecking for user phitruongtrolai@yahoo.com.vn...');
    const userResult = await pool.request()
      .input('email', sql.NVarChar, 'phitruongtrolai@yahoo.com.vn')
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (userResult.recordset.length === 0) {
      console.log('User not found');
    } else {
      const user = userResult.recordset[0];
      console.log('User found:');
      console.log(`- ID: ${user.id}`);
      console.log(`- Username: ${user.username}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Password: ${user.password}`);
      console.log(`- Password type: ${typeof user.password}`);
      console.log(`- Password length: ${user.password ? user.password.length : 0}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- Is active: ${user.isActive}`);
      
      // Test password comparison
      const testPassword = '123456789';
      console.log(`\nTesting password comparison with "${testPassword}":`);
      console.log(`- Direct comparison: ${testPassword === user.password}`);
      console.log(`- String conversion: ${testPassword.toString() === user.password.toString()}`);
      
      // Check for whitespace or special characters
      console.log('\nChecking for whitespace or special characters:');
      console.log(`- Password has leading/trailing whitespace: ${user.password !== user.password.trim()}`);
      console.log(`- Password charCodes:`, Array.from(user.password).map(c => c.charCodeAt(0)));
      console.log(`- Test password charCodes:`, Array.from(testPassword).map(c => c.charCodeAt(0)));
    }
    
    await sql.close();
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

// Run the function
checkSchema();