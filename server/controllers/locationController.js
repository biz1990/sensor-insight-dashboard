
const sql = require('mssql');
const db = require('../config/db');

// Get all locations
exports.getAllLocations = async (req, res) => {
  try {
    const pool = await sql.connect(db.sqlConfig);
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
};

// Get location by ID
exports.getLocationById = async (req, res) => {
  try {
    const locationId = req.params.id;
    const pool = await sql.connect(db.sqlConfig);
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
};

// Create a new location
exports.createLocation = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Location name is required' });
    }
    
    const pool = await sql.connect(db.sqlConfig);
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
};

// Update an existing location
exports.updateLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Location name is required' });
    }
    
    const pool = await sql.connect(db.sqlConfig);
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
};

// Delete a location
exports.deleteLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    
    const pool = await sql.connect(db.sqlConfig);
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
};
