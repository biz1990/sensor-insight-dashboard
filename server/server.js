
// Create a local config file for the server
const serverConfig = {
  // The port the server will listen on
  port: 3001,
  
  // The hostname or IP address where the server is running
  // Use 0.0.0.0 to listen on all interfaces
  host: '0.0.0.0',
  
  // Database configuration
  database: {
    server: '192.168.191.115',  // SQL Server hostname or IP
    database: 'SensorDB', // Database name
    user: 'user1',           // SQL Server username
    password: '12345678', // SQL Server password
    port: 1433,           // SQL Server port
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  }
};

const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const dotenv = require('dotenv');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { sqlConfig } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || serverConfig.port || 3001;
const HOST = process.env.HOST || serverConfig.host || '0.0.0.0';

// Middleware
// Configure CORS to allow requests from any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

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

// Error handling middleware (must be after routes)
app.use(errorHandler);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`API server running on ${HOST}:${PORT}`);
  console.log(`Access the API at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  sql.close(); // Close all SQL connections
  process.exit(0);
});
