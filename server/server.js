
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const dotenv = require('dotenv');
const apiRoutes = require('./routes');
const { sqlConfig } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection on server start
(async function testInitialConnection() {
  try {
    console.log('Attempting initial database connection...');
    console.log('Connection config:', {
      server: sqlConfig.server,
      database: sqlConfig.database,
      user: sqlConfig.user,
      port: sqlConfig.port,
      options: sqlConfig.options
    });
    const pool = new sql.ConnectionPool(sqlConfig);
    await pool.connect();
    console.log('Initial database connection successful!');
    await pool.close();
  } catch (error) {
    console.error('Initial database connection failed:', error.message);
    if (error.originalError) {
      console.error('Original error:', error.originalError.message);
    }
    console.error('Please check your SQL Server configuration and make sure:');
    console.error('1. SQL Server is running and accessible');
    console.error('2. TCP/IP protocol is enabled in SQL Server Configuration Manager');
    console.error('3. SQL Server Browser service is running');
    console.error('4. Firewall allows connections to port 1433');
    console.error('5. SQL Server authentication is enabled and credentials are correct');
  }
})();

// Mount API routes at /api
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  sql.close(); // Close all SQL connections
  process.exit(0);
});
