const sql = require('mssql');
const { sqlConfig } = require('../config/db');

/**
 * Generate a report for a specific device and time period
 */
exports.generateDeviceReport = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate, interval } = req.query;
    
    if (!deviceId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Device ID, start date, and end date are required'
      });
    }
    
    // Check if device exists
    const pool = await sql.connect(sqlConfig);
    const deviceCheck = await pool.request()
      .input('id', sql.Int, deviceId)
      .query('SELECT * FROM Devices WHERE id = @id');
      
    if (deviceCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Device with ID ${deviceId} not found`
      });
    }
    
    // Parse dates with proper timezone handling (Vietnam timezone = UTC+7)
    let start, end;
    try {
      // Parse the dates and adjust for Vietnam timezone (UTC+7)
      start = new Date(startDate);
      end = new Date(endDate);
      
      // Set start time to beginning of day in Vietnam timezone
      start.setUTCHours(0 - 7, 0, 0, 0); // 00:00:00 Vietnam time (subtract 7 hours to get UTC time)
      
      // Set end time to end of day in Vietnam timezone
      end.setUTCHours(23 - 7, 59, 59, 999); // 23:59:59 Vietnam time (subtract 7 hours to get UTC time)
      
      console.log(`Report date range: ${start.toISOString()} to ${end.toISOString()}`);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format.'
      });
    }
    
    // Determine query based on interval
    let query;
    switch (interval) {
      case 'hourly':
        query = `
          SELECT 
            DATEADD(HOUR, DATEDIFF(HOUR, 0, timestamp), 0) as timestamp,
            AVG(temperature) as temperature,
            AVG(humidity) as humidity,
            COUNT(*) as readingCount
          FROM SensorReadings
          WHERE deviceId = @deviceId
            AND timestamp BETWEEN @startDate AND @endDate
          GROUP BY DATEADD(HOUR, DATEDIFF(HOUR, 0, timestamp), 0)
          ORDER BY timestamp
        `;
        break;
      case 'daily':
        query = `
          SELECT 
            CAST(timestamp AS DATE) as timestamp,
            AVG(temperature) as temperature,
            AVG(humidity) as humidity,
            COUNT(*) as readingCount
          FROM SensorReadings
          WHERE deviceId = @deviceId
            AND timestamp BETWEEN @startDate AND @endDate
          GROUP BY CAST(timestamp AS DATE)
          ORDER BY timestamp
        `;
        break;
      default:
        // Raw data (no aggregation)
        query = `
          SELECT *
          FROM SensorReadings
          WHERE deviceId = @deviceId
            AND timestamp BETWEEN @startDate AND @endDate
          ORDER BY timestamp
        `;
    }
    
    // Log the query parameters for debugging
    console.log(`Report query parameters:
      - Device ID: ${deviceId}
      - Start Date: ${start.toISOString()}
      - End Date: ${end.toISOString()}
      - Interval: ${interval || 'raw'}
    `);
    
    // Execute query
    const result = await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .input('startDate', sql.DateTime, start)
      .input('endDate', sql.DateTime, end)
      .query(query);
      
    console.log(`Report query returned ${result.recordset.length} readings`);
    
    // Log a sample of the first reading if available
    if (result.recordset.length > 0) {
      console.log('First reading timestamp:', result.recordset[0].timestamp);
    }
    
    // Get device details
    const deviceResult = await pool.request()
      .input('id', sql.Int, deviceId)
      .query(`
        SELECT d.*, l.name as locationName
        FROM Devices d
        LEFT JOIN DeviceLocations l ON d.locationId = l.id
        WHERE d.id = @id
      `);
    
    const device = deviceResult.recordset[0];
    
    res.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        device: {
          id: device.id,
          name: device.name,
          serialNumber: device.serialNumber,
          location: device.locationName || 'Unknown'
        },
        reportParams: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          interval: interval || 'raw'
        },
        readings: result.recordset
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

/**
 * Get summary statistics for a device
 */
exports.getDeviceStats = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { period } = req.query; // 'day', 'week', 'month'
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }
    
    // Check if device exists
    const pool = await sql.connect(sqlConfig);
    const deviceCheck = await pool.request()
      .input('id', sql.Int, deviceId)
      .query('SELECT * FROM Devices WHERE id = @id');
      
    if (deviceCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Device with ID ${deviceId} not found`
      });
    }
    
    // Determine date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default: // day
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
    }
    
    // Get statistics
    const statsResult = await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, now)
      .query(`
        SELECT 
          COUNT(*) as readingCount,
          MIN(temperature) as minTemperature,
          MAX(temperature) as maxTemperature,
          AVG(temperature) as avgTemperature,
          MIN(humidity) as minHumidity,
          MAX(humidity) as maxHumidity,
          AVG(humidity) as avgHumidity,
          MIN(timestamp) as firstReading,
          MAX(timestamp) as lastReading
        FROM SensorReadings
        WHERE deviceId = @deviceId
          AND timestamp BETWEEN @startDate AND @endDate
      `);
    
    const stats = statsResult.recordset[0];
    
    res.json({
      success: true,
      message: 'Device statistics retrieved successfully',
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        stats
      }
    });
  } catch (error) {
    console.error('Error getting device statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve device statistics',
      error: error.message
    });
  }
};