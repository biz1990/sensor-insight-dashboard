const { executeQuery, sql } = require('../utils/dbUtils');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Get all devices with their location information
 */
exports.getAllDevices = asyncHandler(async (req, res) => {
  const result = await executeQuery(`
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
});

/**
 * Get devices with their latest readings
 */
exports.getDevicesWithLatestReadings = asyncHandler(async (req, res) => {
  // Get all devices with their location information
  const devicesResult = await executeQuery(`
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
    const readingResult = await executeQuery(`
      SELECT TOP 1 *
      FROM SensorReadings
      WHERE deviceId = @deviceId
      ORDER BY timestamp DESC
    `, { deviceId: device.id });
      
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
  }));
  
  res.json({
    success: true,
    message: 'Devices with readings retrieved successfully',
    data: devicesWithReadings
  });
});

/**
 * Get device by ID with its latest reading
 */
exports.getDeviceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await executeQuery(`
    SELECT d.*, l.name as locationName, l.description as locationDescription
    FROM Devices d 
    LEFT JOIN DeviceLocations l ON d.locationId = l.id
    WHERE d.id = @id
  `, { id });
  
  if (result.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Device with ID ${id} not found`
    });
  }
  
  const device = result.recordset[0];
  
  // Get the latest reading for this device
  const readingResult = await executeQuery(`
    SELECT TOP 1 *
    FROM SensorReadings
    WHERE deviceId = @deviceId
    ORDER BY timestamp DESC
  `, { deviceId: id });
  
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
});

/**
 * Create a new device
 */
exports.createDevice = asyncHandler(async (req, res) => {
  const { name, serialNumber, locationId, status = 'offline' } = req.body;
  
  if (!name || !serialNumber || !locationId) {
    return res.status(400).json({
      success: false,
      message: 'Name, serialNumber and locationId are required'
    });
  }
  
  // Check if location exists
  const locationCheck = await executeQuery(
    'SELECT * FROM DeviceLocations WHERE id = @locationId', 
    { locationId }
  );
    
  if (locationCheck.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Location with ID ${locationId} not found`
    });
  }
  
  // Check if serial number is unique
  const serialCheck = await executeQuery(
    'SELECT * FROM Devices WHERE serialNumber = @serialNumber',
    { serialNumber }
  );
    
  if (serialCheck.recordset.length > 0) {
    return res.status(409).json({
      success: false,
      message: `Device with serial number ${serialNumber} already exists`
    });
  }
  
  // Create the device
  const result = await executeQuery(`
    INSERT INTO Devices (name, serialNumber, locationId, status)
    OUTPUT INSERTED.*
    VALUES (@name, @serialNumber, @locationId, @status)
  `, { name, serialNumber, locationId, status });
    
  // Get the location details
  const locationResult = await executeQuery(
    'SELECT * FROM DeviceLocations WHERE id = @locationId',
    { locationId }
  );
    
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
});

/**
 * Update an existing device
 */
exports.updateDevice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, serialNumber, locationId, status } = req.body;
  
  if (!name && !serialNumber && !locationId && !status) {
    return res.status(400).json({
      success: false,
      message: 'No fields to update were provided'
    });
  }
  
  // Check if device exists
  const deviceCheck = await executeQuery(
    'SELECT * FROM Devices WHERE id = @id',
    { id }
  );
    
  if (deviceCheck.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Device with ID ${id} not found`
    });
  }
  
  // Check if location exists if provided
  if (locationId) {
    const locationCheck = await executeQuery(
      'SELECT * FROM DeviceLocations WHERE id = @locationId',
      { locationId }
    );
      
    if (locationCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Location with ID ${locationId} not found`
      });
    }
  }
  
  // Check if serial number is unique if provided
  if (serialNumber) {
    const serialCheck = await executeQuery(
      'SELECT * FROM Devices WHERE serialNumber = @serialNumber AND id != @id',
      { serialNumber, id }
    );
      
    if (serialCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Device with serial number ${serialNumber} already exists`
      });
    }
  }
  
  // Build update query
  let updateQuery = 'UPDATE Devices SET ';
  const queryParams = { id };
  const updateFields = [];
  
  if (name) {
    queryParams.name = name;
    updateFields.push('name = @name');
  }
  
  if (serialNumber) {
    queryParams.serialNumber = serialNumber;
    updateFields.push('serialNumber = @serialNumber');
  }
  
  if (locationId) {
    queryParams.locationId = locationId;
    updateFields.push('locationId = @locationId');
  }
  
  if (status) {
    queryParams.status = status;
    updateFields.push('status = @status');
  }
  
  // Add updatedAt timestamp
  updateFields.push('updatedAt = GETDATE()');
  
  // Complete the query
  updateQuery += updateFields.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';
  
  // Execute the update query
  const result = await executeQuery(updateQuery, queryParams);
  const updatedDevice = result.recordset[0];
  
  // Get the location details
  const locationResult = await executeQuery(
    'SELECT * FROM DeviceLocations WHERE id = @locationId',
    { locationId: updatedDevice.locationId }
  );
    
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
});

/**
 * Delete a device and its associated readings
 */
exports.deleteDevice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // First, delete associated readings
  await executeQuery(
    'DELETE FROM SensorReadings WHERE deviceId = @deviceId',
    { deviceId: id }
  );
    
  // Then delete the device
  const result = await executeQuery(
    'DELETE FROM Devices OUTPUT DELETED.* WHERE id = @id',
    { id }
  );
    
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
});

/**
 * Get readings for a device within a specified time period
 */
exports.getDeviceReadings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hours = parseInt(req.query.hours) || 24; // Default to 24 hours
  
  // Check if device exists
  const deviceCheck = await executeQuery(
    'SELECT * FROM Devices WHERE id = @id',
    { id }
  );
    
  if (deviceCheck.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Device with ID ${id} not found`
    });
  }
  
  // Get readings from the last X hours
  const result = await executeQuery(`
    SELECT * 
    FROM SensorReadings 
    WHERE deviceId = @deviceId
    AND timestamp >= DATEADD(HOUR, -@hours, GETDATE())
    ORDER BY timestamp DESC
  `, { deviceId: id, hours });
    
  res.json({
    success: true,
    message: `Readings for device ${id} retrieved successfully`,
    data: result.recordset
  });
});

/**
 * Get the 10 most recent readings for a device
 */
exports.getLatestReadings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if device exists
  const deviceCheck = await executeQuery(
    'SELECT * FROM Devices WHERE id = @id',
    { id }
  );
    
  if (deviceCheck.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Device with ID ${id} not found`
    });
  }

  const result = await executeQuery(`
    SELECT TOP 10 *
    FROM SensorReadings
    WHERE deviceId = @deviceId
    ORDER BY timestamp DESC
  `, { deviceId: id });

  res.json({ 
    success: true, 
    message: `Latest 10 readings for device ${id} retrieved successfully`,
    data: result.recordset 
  });
});

/**
 * Get readings for the current day
 */
exports.getDailyReadings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if device exists
  const deviceCheck = await executeQuery(
    'SELECT * FROM Devices WHERE id = @id',
    { id }
  );
    
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

  const result = await executeQuery(`
    SELECT *
    FROM SensorReadings
    WHERE deviceId = @deviceId
      AND timestamp >= @startTime AND timestamp < @endTime
    ORDER BY timestamp ASC
  `, { 
    deviceId: id,
    startTime: today,
    endTime: tomorrow
  });

  res.json({ 
    success: true, 
    message: `Daily readings for device ${id} retrieved successfully`,
    data: result.recordset 
  });
});

/**
 * Get readings for a specified date range
 */
exports.getRangeReadings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: 'Both from and to dates are required'
    });
  }

  // Check if device exists
  const deviceCheck = await executeQuery(
    'SELECT * FROM Devices WHERE id = @id',
    { id }
  );
    
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

  const result = await executeQuery(`
    SELECT *
    FROM SensorReadings
    WHERE deviceId = @deviceId
      AND timestamp BETWEEN @startTime AND @endTime
    ORDER BY timestamp ASC
  `, {
    deviceId: id,
    startTime: fromDate,
    endTime: toDate
  });

  res.json({ 
    success: true, 
    message: `Readings for device ${id} from ${from} to ${to} retrieved successfully`,
    data: result.recordset 
  });
});