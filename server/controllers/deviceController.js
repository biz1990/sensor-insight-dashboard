
const sql = require('mssql');
const db = require('../config/db');

// Get all devices
exports.getAllDevices = async (req, res) => {
  try {
    const pool = await sql.connect(db.sqlConfig);
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
};

// Get device by ID
exports.getDeviceById = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const pool = await sql.connect(db.sqlConfig);
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
};

// Create a new device
exports.createDevice = async (req, res) => {
  try {
    const { name, serialNumber, locationId, status } = req.body;
    
    if (!name || !serialNumber || !locationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device name, serial number, and location ID are required'
      });
    }
    
    const pool = await sql.connect(db.sqlConfig);
    
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
};

// Update an existing device
exports.updateDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { name, serialNumber, locationId, status } = req.body;
    
    if (!name || !serialNumber || !locationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device name, serial number, and location ID are required'
      });
    }
    
    const pool = await sql.connect(db.sqlConfig);
    
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
};

// Delete a device
exports.deleteDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    // Connect to database
    const pool = await sql.connect(db.sqlConfig);
    
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
};

// Get device readings
exports.getDeviceReadings = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const hours = parseInt(req.query.hours || '24', 10);
    
    const pool = await sql.connect(db.sqlConfig);
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
};
