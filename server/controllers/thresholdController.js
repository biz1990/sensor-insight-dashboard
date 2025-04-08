
const sql = require('mssql');
const db = require('../config/db');

// Get all warning thresholds
exports.getThresholds = async (req, res) => {
  try {
    const pool = await sql.connect(db.sqlConfig);
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
};

// Update warning thresholds
exports.updateThresholds = async (req, res) => {
  try {
    const { minTemperature, maxTemperature, minHumidity, maxHumidity, updatedBy } = req.body;
    
    if (minTemperature === undefined || maxTemperature === undefined || 
        minHumidity === undefined || maxHumidity === undefined || !updatedBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'All threshold values and updatedBy are required'
      });
    }
    
    const pool = await sql.connect(db.sqlConfig);
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
};
