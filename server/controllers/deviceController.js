const sql = require('mssql');
const { sqlConfig } = require('../config/db');

// Existing controller functions remain the same...

// Get all devices
exports.getAllDevices = async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT 
        d.*, 
        l.id AS locationId,
        l.name AS locationName,
        l.description AS locationDescription
      FROM Devices d 
      LEFT JOIN DeviceLocations l ON d.locationId = l.id
    `);

    // Convert flat data to nested structure
    const devices = result.recordset.map(device => ({
      id: device.id,
      name: device.name,
      serialNumber: device.serialNumber,
      status: device.status,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
      locationId: device.locationId,
      location: device.locationId ? {
        id: device.locationId,
        name: device.locationName,
        description: device.locationDescription
      } : null
    }));

    res.json({
      success: true,
      message: 'Devices retrieved successfully',
      data: devices
    });
  } catch (error) {
    console.error('Error getting devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve devices',
      error: error.message
    });
  }
};

// Get devices with their latest readings
exports.getDevicesWithLatestReadings = async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    
    // Get all devices with their location information
    const devicesResult = await pool.request().query(`
      SELECT d.*, l.name as locationName, l.description as locationDescription
      FROM Devices d 
      LEFT JOIN DeviceLocations l ON d.locationId = l.id
    `);
    
    const devices = devicesResult.recordset;
    
    if (devices.length === 0) {
      return res.json({
        success: true,
        message: 'No devices found',
        data: []
      });
    }
    
    // For each device, get its latest reading
    const devicesWithReadings = await Promise.all(devices.map(async (device) => {
      try {
        const readingResult = await pool.request()
          .input('deviceId', sql.Int, device.id)
          .query(`
            SELECT TOP 1 *
            FROM SensorReadings
            WHERE deviceId = @deviceId
            ORDER BY timestamp DESC
          `);
          
        const reading = readingResult.recordset[0];
        
        return {
          ...device,
          location: {
            id: device.locationId,
            name: device.locationName,
            description: device.locationDescription
          },
          lastReading: reading || null
        };
      } catch (error) {
        console.error(`Error getting reading for device ${device.id}:`, error);
        return device;
      }
    }));
    
    res.json({
      success: true,
      message: 'Devices with readings retrieved successfully',
      data: devicesWithReadings
    });
  } catch (error) {
    console.error('Error getting devices with readings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve devices with readings',
      error: error.message
    });
  }
};

// Get device by ID
exports.getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT d.*, l.name as locationName, l.description as locationDescription
        FROM Devices d 
        LEFT JOIN DeviceLocations l ON d.locationId = l.id
        WHERE d.id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Device with ID ${id} not found`
      });
    }
    
    const device = result.recordset[0];
    
    // Get the latest reading for this device
    const readingResult = await pool.request()
      .input('deviceId', sql.Int, id)
      .query(`
        SELECT TOP 1 *
        FROM SensorReadings
        WHERE deviceId = @deviceId
        ORDER BY timestamp DESC
      `);
    
    const deviceWithDetails = {
      ...device,
      location: {
        id: device.locationId,
        name: device.locationName,
        description: device.locationDescription
      },
      lastReading: readingResult.recordset[0] || null
    };
    
    res.json({
      success: true,
      message: 'Device retrieved successfully',
      data: deviceWithDetails
    });
  } catch (error) {
    console.error('Error getting device by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve device',
      error: error.message
    });
  }
};

// Create new device
exports.createDevice = async (req, res) => {
  try {
    const { name, serialNumber, locationId, status = 'offline' } = req.body;
    
    if (!name || !serialNumber || !locationId) {
      return res.status(400).json({
        success: false,
        message: 'Name, serialNumber and locationId are required'
      });
    }
    
    const pool = await sql.connect(sqlConfig);
    
    // Check if location exists
    const locationCheck = await pool.request()
      .input('locationId', sql.Int, locationId)
      .query('SELECT * FROM DeviceLocations WHERE id = @locationId');
      
    if (locationCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Location with ID ${locationId} not found`
      });
    }
    
    // Check if serial number is unique
    const serialCheck = await pool.request()
      .input('serialNumber', sql.NVarChar, serialNumber)
      .query('SELECT * FROM Devices WHERE serialNumber = @serialNumber');
      
    if (serialCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Device with serial number ${serialNumber} already exists`
      });
    }
    
    // Create the device
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('serialNumber', sql.NVarChar, serialNumber)
      .input('locationId', sql.Int, locationId)
      .input('status', sql.NVarChar, status)
      .query(`
        INSERT INTO Devices (name, serialNumber, locationId, status)
        OUTPUT INSERTED.*
        VALUES (@name, @serialNumber, @locationId, @status)
      `);
      
    // Get the location details
    const locationResult = await pool.request()
      .input('locationId', sql.Int, locationId)
      .query('SELECT * FROM DeviceLocations WHERE id = @locationId');
      
    const location = locationResult.recordset[0];
      
    const deviceWithLocation = {
      ...result.recordset[0],
      location: location
    };
    
    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: deviceWithLocation
    });
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create device',
      error: error.message
    });
  }
};

// Update device
exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, serialNumber, locationId, status } = req.body;
    
    if (!name && !serialNumber && !locationId && !status) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update were provided'
      });
    }
    
    const pool = await sql.connect(sqlConfig);
    
    // Check if device exists
    const deviceCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Devices WHERE id = @id');
      
    if (deviceCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Device with ID ${id} not found`
      });
    }
    
    // Check if location exists if provided
    if (locationId) {
      const locationCheck = await pool.request()
        .input('locationId', sql.Int, locationId)
        .query('SELECT * FROM DeviceLocations WHERE id = @locationId');
        
      if (locationCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Location with ID ${locationId} not found`
        });
      }
    }
    
    // Check if serial number is unique if provided
    if (serialNumber) {
      const serialCheck = await pool.request()
        .input('serialNumber', sql.NVarChar, serialNumber)
        .input('id', sql.Int, id)
        .query('SELECT * FROM Devices WHERE serialNumber = @serialNumber AND id != @id');
        
      if (serialCheck.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Device with serial number ${serialNumber} already exists`
        });
      }
    }
    
    // Build update query
    let updateQuery = 'UPDATE Devices SET ';
    const inputs = [];
    
    if (name) {
      inputs.push({ name: 'name', type: sql.NVarChar, value: name });
      updateQuery += 'name = @name, ';
    }
    
    if (serialNumber) {
      inputs.push({ name: 'serialNumber', type: sql.NVarChar, value: serialNumber });
      updateQuery += 'serialNumber = @serialNumber, ';
    }
    
    if (locationId) {
      inputs.push({ name: 'locationId', type: sql.Int, value: locationId });
      updateQuery += 'locationId = @locationId, ';
    }
    
    if (status) {
      inputs.push({ name: 'status', type: sql.NVarChar, value: status });
      updateQuery += 'status = @status, ';
    }
    
    // Add updatedAt timestamp
    updateQuery += 'updatedAt = GETDATE() ';
    
    // Complete the query
    updateQuery += 'OUTPUT INSERTED.* WHERE id = @id';
    
    // Execute the update query
    const request = pool.request().input('id', sql.Int, id);
    
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    
    const result = await request.query(updateQuery);
    const updatedDevice = result.recordset[0];
    
    // Get the location details
    const locationResult = await pool.request()
      .input('locationId', sql.Int, updatedDevice.locationId)
      .query('SELECT * FROM DeviceLocations WHERE id = @locationId');
      
    const location = locationResult.recordset[0];
      
    const deviceWithLocation = {
      ...updatedDevice,
      location: location
    };
    
    res.json({
      success: true,
      message: 'Device updated successfully',
      data: deviceWithLocation
    });
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device',
      error: error.message
    });
  }
};

// Delete device
exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await sql.connect(sqlConfig);
    
    // First, delete associated readings
    await pool.request()
      .input('deviceId', sql.Int, id)
      .query('DELETE FROM SensorReadings WHERE deviceId = @deviceId');
      
    // Then delete the device
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Devices OUTPUT DELETED.* WHERE id = @id');
      
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Device with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      message: 'Device and associated readings deleted successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device',
      error: error.message
    });
  }
};

// Get readings for a device
exports.getDeviceReadings = async (req, res) => {
  try {
    const { id } = req.params;
    const hours = parseInt(req.query.hours) || 24; // Default to 24 hours
    
    const pool = await sql.connect(sqlConfig);
    
    // Check if device exists
    const deviceCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Devices WHERE id = @id');
      
    if (deviceCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Device with ID ${id} not found`
      });
    }
    
    // Get readings from the last X hours
    const result = await pool.request()
      .input('deviceId', sql.Int, id)
      .input('hours', sql.Int, hours)
      .query(`
        SELECT * 
        FROM SensorReadings 
        WHERE deviceId = @deviceId
        AND timestamp >= DATEADD(HOUR, -@hours, GETDATE())
        ORDER BY timestamp DESC
      `);
      
    res.json({
      success: true,
      message: `Readings for device ${id} retrieved successfully`,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error getting device readings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve device readings',
      error: error.message
    });
  }
};

// Get latest readings (10 most recent readings)
exports.getLatestReadings = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(sqlConfig);

    // Check if device exists
    const deviceCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Devices WHERE id = @id');
      
    if (deviceCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Device with ID ${id} not found`
      });
    }

    const result = await pool.request()
      .input('deviceId', sql.Int, id)
      .query(`
        SELECT TOP 10 *
        FROM SensorReadings
        WHERE deviceId = @deviceId
        ORDER BY timestamp DESC
      `);

    res.json({ 
      success: true, 
      message: `Latest 10 readings for device ${id} retrieved successfully`,
      data: result.recordset 
    });
  } catch (error) {
    console.error('Error getting latest readings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve latest readings',
      error: error.message 
    });
  }
};

// Get daily readings (readings from the current day)
exports.getDailyReadings = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if device exists
    const pool = await sql.connect(sqlConfig);
    const deviceCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Devices WHERE id = @id');
      
    if (deviceCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Device with ID ${id} not found`
      });
    }
    
    // Get today's date boundaries in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const result = await pool.request()
      .input('deviceId', sql.Int, id)
      .input('startTime', sql.DateTime, today)
      .input('endTime', sql.DateTime, tomorrow)
      .query(`
        SELECT *
        FROM SensorReadings
        WHERE deviceId = @deviceId
          AND timestamp >= @startTime AND timestamp < @endTime
        ORDER BY timestamp ASC
      `);

    res.json({ 
      success: true, 
      message: `Daily readings for device ${id} retrieved successfully`,
      data: result.recordset 
    });
  } catch (error) {
    console.error('Error getting daily readings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve daily readings',
      error: error.message 
    });
  }
};

// Get readings for a date range
exports.getRangeReadings = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Both from and to dates are required'
      });
    }

    // Check if device exists
    const pool = await sql.connect(sqlConfig);
    const deviceCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Devices WHERE id = @id');
      
    if (deviceCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Device with ID ${id} not found`
      });
    }

    // Parse and validate dates
    let fromDate, toDate;
    try {
      fromDate = new Date(from);
      toDate = new Date(to);
      
      // Set end time to end of day
      toDate.setHours(23, 59, 59, 999);
      
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format.'
      });
    }

    const result = await pool.request()
      .input('deviceId', sql.Int, id)
      .input('startTime', sql.DateTime, fromDate)
      .input('endTime', sql.DateTime, toDate)
      .query(`
        SELECT *
        FROM SensorReadings
        WHERE deviceId = @deviceId
          AND timestamp BETWEEN @startTime AND @endTime
        ORDER BY timestamp ASC
      `);

    res.json({ 
      success: true, 
      message: `Readings for device ${id} from ${from} to ${to} retrieved successfully`,
      data: result.recordset 
    });
  } catch (error) {
    console.error('Error getting range readings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve readings for the selected date range',
      error: error.message 
    });
  }
};
