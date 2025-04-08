
const sql = require('mssql');
const { sqlConfig } = require('../config/db');

// Test database connection - GET endpoint
exports.testConnectionGet = async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    await pool.request().query('SELECT 1 as result');
    
    res.json({
      success: true,
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: `Database connection failed: ${error.message}`
    });
  }
};

// Test database connection - POST endpoint with custom config
exports.testConnectionPost = async (req, res) => {
  try {
    // Get connection parameters from request body
    const customConfig = {
      ...sqlConfig,
      ...req.body
    };
    
    console.log('Testing connection with config:', {
      server: customConfig.server,
      database: customConfig.database,
      user: customConfig.user,
      options: customConfig.options
    });
    
    const pool = await sql.connect(customConfig);
    await pool.request().query('SELECT 1 as result');
    await pool.close();
    
    res.json({
      success: true,
      message: 'Database connection successful with provided configuration'
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: `Database connection failed: ${error.message}`
    });
  }
};

// Execute a custom SQL query
exports.executeQuery = async (req, res) => {
  try {
    const { query, params, config } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }
    
    // Use provided config if available, otherwise use default
    const connectionConfig = config || sqlConfig;
    
    const pool = await sql.connect(connectionConfig);
    const request = pool.request();
    
    // Add parameters if provided
    if (params && Array.isArray(params)) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }
    
    const result = await request.query(query);
    
    res.json({
      success: true,
      message: 'Query executed successfully',
      data: result.recordset || []
    });
  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({
      success: false,
      message: `Query execution failed: ${error.message}`
    });
  }
};

