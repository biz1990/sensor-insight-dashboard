
const sql = require('mssql');
const { sqlConfig } = require('../config/db');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query('SELECT * FROM Users');
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.recordset
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Users WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message
    });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role = 'user', isActive = true } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required'
      });
    }
    
    const pool = await sql.connect(sqlConfig);
    
    // Check if user with this username or email already exists
    const checkResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE username = @username OR email = @email');
    
    if (checkResult.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }
    
    // Insert new user
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password) // In a real app, this should be hashed
      .input('role', sql.NVarChar, role)
      .input('isActive', sql.Bit, isActive)
      .query(`
        INSERT INTO Users (username, email, password, role, isActive)
        OUTPUT INSERTED.*
        VALUES (@username, @email, @password, @role, @isActive)
      `);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, isActive } = req.body;
    
    if (!username && !email && !password && role === undefined && isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update were provided'
      });
    }
    
    const pool = await sql.connect(sqlConfig);
    
    // Build dynamic update query
    let updateQuery = 'UPDATE Users SET ';
    const inputs = [];
    
    if (username) {
      inputs.push({ name: 'username', type: sql.NVarChar, value: username });
      updateQuery += 'username = @username, ';
    }
    
    if (email) {
      inputs.push({ name: 'email', type: sql.NVarChar, value: email });
      updateQuery += 'email = @email, ';
    }
    
    if (password) {
      inputs.push({ name: 'password', type: sql.NVarChar, value: password });
      updateQuery += 'password = @password, ';
    }
    
    if (role !== undefined) {
      inputs.push({ name: 'role', type: sql.NVarChar, value: role });
      updateQuery += 'role = @role, ';
    }
    
    if (isActive !== undefined) {
      inputs.push({ name: 'isActive', type: sql.Bit, value: isActive });
      updateQuery += 'isActive = @isActive, ';
    }
    
    // Add updatedAt timestamp
    updateQuery += 'updatedAt = GETDATE() ';
    
    // Complete the query
    updateQuery += 'OUTPUT INSERTED.* WHERE id = @id';
    
    // Set up the query with inputs
    const request = pool.request().input('id', sql.Int, id);
    
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    
    const result = await request.query(updateQuery);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Users OUTPUT DELETED.* WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};
