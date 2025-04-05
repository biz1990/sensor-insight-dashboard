
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SQL Server Configuration
const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    instanceName: process.env.DB_INSTANCE_NAME || undefined,
    connectTimeout: 30000, // Increased connection timeout
    requestTimeout: 30000   // Increased request timeout
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

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

// Test database connection
app.post('/api/test-connection', async (req, res) => {
  try {
    const config = req.body;
    // Validate required fields
    if (!config.server || !config.database || !config.user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid database configuration. Missing required fields.'
      });
    }
    
    // Create a new connection with the provided config
    const testConfig = {
      user: config.user,
      password: config.password,
      server: config.server,
      database: config.database,
      port: config.port || 1433,
      options: {
        ...config.options,
        connectTimeout: 15000, // 15 seconds timeout for connection test
        instanceName: config.instanceName || undefined
      }
    };
    
    console.log('Testing connection with config:', {
      server: testConfig.server,
      database: testConfig.database,
      user: testConfig.user,
      port: testConfig.port,
      options: testConfig.options
    });
    
    // Try to connect
    const testPool = new sql.ConnectionPool(testConfig);
    await testPool.connect();
    await testPool.close();
    
    res.json({ 
      success: true, 
      message: 'Database connection successful!'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    let errorMessage = error.message;
    if (error.originalError) {
      errorMessage += ' - ' + error.originalError.message;
    }
    res.status(500).json({ 
      success: false, 
      message: `Connection failed: ${errorMessage}`
    });
  }
});

// Execute a SQL query
app.post('/api/execute-query', async (req, res) => {
  try {
    const { config, query, params } = req.body;
    
    // Use the provided config or fall back to environment variables
    const connectionConfig = config || sqlConfig;
    
    // Create a new connection pool
    const pool = new sql.ConnectionPool(connectionConfig);
    await pool.connect();
    
    // Prepare and execute the query
    const request = pool.request();
    
    // Add parameters if provided
    if (params && Array.isArray(params)) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      // Replace @paramName with @paramX in the query
      const modifiedQuery = query.replace(/@(\w+)/g, (match, paramName) => {
        const index = ['deviceId', 'hours'].indexOf(paramName);
        return index !== -1 ? `@param${index}` : match;
      });
      
      const result = await request.query(modifiedQuery);
      await pool.close();
      
      res.json({ 
        success: true, 
        data: result.recordset
      });
    } else {
      const result = await request.query(query);
      await pool.close();
      
      res.json({ 
        success: true, 
        data: result.recordset
      });
    }
  } catch (error) {
    console.error('Query execution error:', error);
    let errorMessage = error.message;
    if (error.originalError) {
      errorMessage += ' - ' + error.originalError.message;
    }
    res.status(500).json({ 
      success: false, 
      message: `Query execution failed: ${errorMessage}`
    });
  }
});

// Route for deleting a device
app.delete('/api/devices/:id', async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    // Connect to database
    const pool = await sql.connect(sqlConfig);
    
    // First delete any sensor readings associated with this device
    await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .query('DELETE FROM SensorReadings WHERE deviceId = @deviceId');
    
    // Then delete the device
    const result = await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .query('DELETE FROM Devices WHERE id = @deviceId');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Device successfully deleted'
    });
    
  } catch (error) {
    console.error('Error deleting device:', error);
    let errorMessage = error.message;
    if (error.originalError) {
      errorMessage += ' - ' + error.originalError.message;
    }
    res.status(500).json({
      success: false,
      message: `Failed to delete device: ${errorMessage}`
    });
  }
});

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
