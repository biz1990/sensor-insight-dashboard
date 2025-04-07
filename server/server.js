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

// API status endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Sensor Monitoring API is running',
    version: '1.0.0' 
  });
});

// Test database connection - GET endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    // Try to connect using the default config
    const pool = new sql.ConnectionPool(sqlConfig);
    await pool.connect();
    await pool.close();
    
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

// Test database connection - POST endpoint (existing)
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

// GET all locations
app.get('/api/locations', async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .query('SELECT * FROM DeviceLocations');
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch locations: ${error.message}`
    });
  }
});

// GET location by ID
app.get('/api/locations/:id', async (req, res) => {
  try {
    const locationId = req.params.id;
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('id', sql.Int, locationId)
      .query('SELECT * FROM DeviceLocations WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch location: ${error.message}`
    });
  }
});

// POST new location
app.post('/api/locations', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Location name is required' });
    }
    
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || '')
      .query(`
        INSERT INTO DeviceLocations (name, description, createdAt, updatedAt) 
        OUTPUT INSERTED.* 
        VALUES (@name, @description, GETDATE(), GETDATE())
      `);
    
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to create location: ${error.message}`
    });
  }
});

// PUT update location
app.put('/api/locations/:id', async (req, res) => {
  try {
    const locationId = req.params.id;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Location name is required' });
    }
    
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('id', sql.Int, locationId)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || '')
      .query(`
        UPDATE DeviceLocations 
        SET name = @name, description = @description, updatedAt = GETDATE() 
        OUTPUT INSERTED.* 
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to update location: ${error.message}`
    });
  }
});

// DELETE location
app.delete('/api/locations/:id', async (req, res) => {
  try {
    const locationId = req.params.id;
    
    const pool = await sql.connect(sqlConfig);
    // Check if there are devices using this location
    const checkDevices = await pool.request()
      .input('locationId', sql.Int, locationId)
      .query('SELECT COUNT(*) as deviceCount FROM Devices WHERE locationId = @locationId');
    
    if (checkDevices.recordset[0].deviceCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete location with associated devices'
      });
    }
    
    const result = await pool.request()
      .input('id', sql.Int, locationId)
      .query('DELETE FROM DeviceLocations WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    res.json({ success: true, message: 'Location successfully deleted' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to delete location: ${error.message}`
    });
  }
});

// GET all devices
app.get('/api/devices', async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .query(`
        SELECT d.*, l.name as locationName, l.description as locationDescription 
        FROM Devices d 
        LEFT JOIN DeviceLocations l ON d.locationId = l.id
      `);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch devices: ${error.message}`
    });
  }
});

// GET device by ID
app.get('/api/devices/:id', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('id', sql.Int, deviceId)
      .query(`
        SELECT d.*, l.name as locationName, l.description as locationDescription 
        FROM Devices d 
        LEFT JOIN DeviceLocations l ON d.locationId = l.id 
        WHERE d.id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch device: ${error.message}`
    });
  }
});

// POST new device
app.post('/api/devices', async (req, res) => {
  try {
    const { name, serialNumber, locationId, status } = req.body;
    
    if (!name || !serialNumber || !locationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device name, serial number, and location ID are required'
      });
    }
    
    const pool = await sql.connect(sqlConfig);
    
    // Check if serial number is already in use
    const checkSerial = await pool.request()
      .input('serialNumber', sql.NVarChar, serialNumber)
      .query('SELECT COUNT(*) as count FROM Devices WHERE serialNumber = @serialNumber');
    
    if (checkSerial.recordset[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Serial number is already in use'
      });
    }
    
    // Check if location exists
    const checkLocation = await pool.request()
      .input('locationId', sql.Int, locationId)
      .query('SELECT COUNT(*) as count FROM DeviceLocations WHERE id = @locationId');
    
    if (checkLocation.recordset[0].count === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Location does not exist'
      });
    }
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('serialNumber', sql.NVarChar, serialNumber)
      .input('locationId', sql.Int, locationId)
      .input('status', sql.NVarChar, status || 'offline')
      .query(`
        INSERT INTO Devices (name, serialNumber, locationId, status, createdAt, updatedAt) 
        OUTPUT INSERTED.* 
        VALUES (@name, @serialNumber, @locationId, @status, GETDATE(), GETDATE())
      `);
    
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to create device: ${error.message}`
    });
  }
});

// PUT update device
app.put('/api/devices/:id', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { name, serialNumber, locationId, status } = req.body;
    
    if (!name || !serialNumber || !locationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device name, serial number, and location ID are required'
      });
    }
    
    const pool = await sql.connect(sqlConfig);
    
    // Check if serial number is already in use by another device
    const checkSerial = await pool.request()
      .input('serialNumber', sql.NVarChar, serialNumber)
      .input('deviceId', sql.Int, deviceId)
      .query('SELECT COUNT(*) as count FROM Devices WHERE serialNumber = @serialNumber AND id <> @deviceId');
    
    if (checkSerial.recordset[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Serial number is already in use by another device'
      });
    }
    
    // Check if location exists
    const checkLocation = await pool.request()
      .input('locationId', sql.Int, locationId)
      .query('SELECT COUNT(*) as count FROM DeviceLocations WHERE id = @locationId');
    
    if (checkLocation.recordset[0].count === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Location does not exist'
      });
    }
    
    const result = await pool.request()
      .input('id', sql.Int, deviceId)
      .input('name', sql.NVarChar, name)
      .input('serialNumber', sql.NVarChar, serialNumber)
      .input('locationId', sql.Int, locationId)
      .input('status', sql.NVarChar, status || 'offline')
      .query(`
        UPDATE Devices 
        SET name = @name, serialNumber = @serialNumber, locationId = @locationId, 
            status = @status, updatedAt = GETDATE() 
        OUTPUT INSERTED.* 
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to update device: ${error.message}`
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

// GET sensor readings for a device
app.get('/api/devices/:id/readings', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const hours = parseInt(req.query.hours || '24', 10);
    
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .input('hours', sql.Int, hours)
      .query(`
        SELECT * FROM SensorReadings 
        WHERE deviceId = @deviceId 
        AND timestamp >= DATEADD(hour, -@hours, GETDATE())
        ORDER BY timestamp
      `);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch readings: ${error.message}`
    });
  }
});

// POST new sensor reading
app.post('/api/readings', async (req, res) => {
  try {
    const { deviceId, temperature, humidity } = req.body;
    
    if (!deviceId || temperature === undefined || humidity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device ID, temperature, and humidity are required'
      });
    }
    
    const pool = await sql.connect(sqlConfig);
    
    // Check if device exists
    const checkDevice = await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .query('SELECT COUNT(*) as count FROM Devices WHERE id = @deviceId');
    
    if (checkDevice.recordset[0].count === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device does not exist'
      });
    }
    
    const result = await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .input('temperature', sql.Decimal(5,2), temperature)
      .input('humidity', sql.Decimal(5,2), humidity)
      .query(`
        INSERT INTO SensorReadings (deviceId, temperature, humidity, timestamp) 
        OUTPUT INSERTED.* 
        VALUES (@deviceId, @temperature, @humidity, GETDATE())
      `);
    
    // Update device status to 'online'
    await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .query(`
        UPDATE Devices 
        SET status = 'online', updatedAt = GETDATE() 
        WHERE id = @deviceId
      `);
    
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error creating reading:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to create reading: ${error.message}`
    });
  }
});

// GET all warning thresholds
app.get('/api/thresholds', async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .query('SELECT TOP 1 * FROM WarningThresholds ORDER BY updatedAt DESC');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'No thresholds found' });
    }
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch thresholds: ${error.message}`
    });
  }
});

// POST/Update warning thresholds
app.post('/api/thresholds', async (req, res) => {
  try {
    const { minTemperature, maxTemperature, minHumidity, maxHumidity, updatedBy } = req.body;
    
    if (minTemperature === undefined || maxTemperature === undefined || 
        minHumidity === undefined || maxHumidity === undefined || !updatedBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'All threshold values and updatedBy are required'
      });
    }
    
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('minTemperature', sql.Decimal(5,2), minTemperature)
      .input('maxTemperature', sql.Decimal(5,2), maxTemperature)
      .input('minHumidity', sql.Decimal(5,2), minHumidity)
      .input('maxHumidity', sql.Decimal(5,2), maxHumidity)
      .input('updatedBy', sql.Int, updatedBy)
      .query(`
        INSERT INTO WarningThresholds 
        (minTemperature, maxTemperature, minHumidity, maxHumidity, updatedBy, updatedAt) 
        OUTPUT INSERTED.* 
        VALUES (@minTemperature, @maxTemperature, @minHumidity, @maxHumidity, @updatedBy, GETDATE())
      `);
    
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error creating thresholds:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to create thresholds: ${error.message}`
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
