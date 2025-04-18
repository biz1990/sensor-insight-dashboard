const sql = require('mssql');
const { sqlConfig } = require('../config/db');

/**
 * Get a connection pool from SQL Server
 * @returns {Promise<sql.ConnectionPool>} SQL connection pool
 */
const getPool = async () => {
  try {
    return await sql.connect(sqlConfig);
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw new Error('Failed to connect to database');
  }
};

/**
 * Execute a SQL query with parameters
 * @param {string} query - SQL query string
 * @param {Object} params - Object containing parameter names and values
 * @returns {Promise<any>} Query result
 */
const executeQuery = async (query, params = {}) => {
  const pool = await getPool();
  const request = pool.request();
  
  // Add parameters to request
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      // Determine SQL type based on JavaScript type
      let sqlType;
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          sqlType = sql.Int;
        } else {
          sqlType = sql.Float;
        }
      } else if (value instanceof Date) {
        sqlType = sql.DateTime;
      } else if (typeof value === 'boolean') {
        sqlType = sql.Bit;
      } else {
        sqlType = sql.NVarChar;
      }
      
      request.input(key, sqlType, value);
    }
  });
  
  return await request.query(query);
};

module.exports = {
  getPool,
  executeQuery,
  sql // Export sql for direct access to data types
};