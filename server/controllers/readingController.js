
const sql = require('mssql');
const db = require('../config/db');

// Create a new sensor reading
exports.createReading = async (req, res) => {
  try {
    const { deviceId, temperature, humidity } = req.body;
    
    if (!deviceId || temperature === undefined || humidity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device ID, temperature, and humidity are required'
      });
    }
    
    const pool = await sql.connect(db.sqlConfig);
    
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
};
