
const sql = require('mssql');
const db = require('../config/db');

// Test database connection - GET endpoint
exports.testConnectionGet = async (req, res) => {
  try {
    // Try to connect using the default config
    const pool = new sql.ConnectionPool(db.sqlConfig);
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
};

// Test database connection - POST endpoint
exports.testConnectionPost = async (req, res) => {
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
};

// Execute a SQL query
exports.executeQuery = async (req, res) => {
  try {
    const { config, query, params } = req.body;
    
    // Use the provided config or fall back to environment variables
    const connectionConfig = config || db.sqlConfig;
    
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
};
