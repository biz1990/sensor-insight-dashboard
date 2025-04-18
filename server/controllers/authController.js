const sql = require('mssql');
const { sqlConfig } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Verify bcrypt is working
console.log('Bcrypt version:', bcrypt.version || 'unknown');
try {
  const testSalt = bcrypt.genSaltSync(10);
  const testHash = bcrypt.hashSync('test', testSalt);
  console.log('Bcrypt test successful, hash generated:', testHash.substring(0, 10) + '...');
} catch (error) {
  console.error('Bcrypt test failed:', error);
}

// Create default admin user if none exists
const createDefaultAdminIfNeeded = async () => {
  try {
    const pool = await sql.connect(sqlConfig);
    
    // Check if any admin user exists
    const adminCheck = await pool.request()
      .query("SELECT COUNT(*) as count FROM Users WHERE role = 'admin'");
    
    if (adminCheck.recordset[0].count === 0) {
      console.log('No admin users found. Creating default admin user...');
      
      // Create default admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await pool.request()
        .input('username', sql.NVarChar, 'admin')
        .input('email', sql.NVarChar, 'admin@example.com')
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, 'admin')
        .input('isActive', sql.Bit, true)
        .query(`
          INSERT INTO Users (username, email, password, role, isActive)
          VALUES (@username, @email, @password, @role, @isActive)
        `);
      
      console.log('Default admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
};

// Call the function to create default admin
createDefaultAdminIfNeeded();

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt with email:', email);
    
    if (!email || !password) {
      console.log('Email or password missing');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (result.recordset.length === 0) {
      console.log('User not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const user = result.recordset[0];
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive
    });
    
    // Check if user is active
    if (user.isActive === false) {
      console.log('User account is inactive');
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact an administrator.'
      });
    }
    
    // Enhanced password comparison with detailed logging
    let isMatch = false;
    
    console.log('Password details:', {
      type: typeof user.password,
      length: user.password ? user.password.length : 0,
      isHashed: user.password && user.password.startsWith('$2')
    });
    
    // First try direct comparison for plain text passwords
    if (user.password === password) {
      console.log('Direct password comparison successful');
      isMatch = true;
    } 
    // Then try bcrypt comparison for hashed passwords
    else if (user.password && user.password.startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(password, user.password);
        console.log('Bcrypt password comparison result:', isMatch);
      } catch (bcryptError) {
        console.error('Error during bcrypt comparison:', bcryptError);
      }
    }
    
    // If still no match, try string conversion as a last resort
    if (!isMatch && user.password && password) {
      isMatch = user.password.toString() === password.toString();
      console.log('String conversion comparison result:', isMatch);
    }
    
    // If password matches and it's not hashed, update it to a hashed version
    if (isMatch && user.password && !user.password.startsWith('$2')) {
      try {
        console.log('Updating plain text password to hashed version');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await pool.request()
          .input('id', sql.Int, user.id)
          .input('password', sql.NVarChar, hashedPassword)
          .query('UPDATE Users SET password = @password, updatedAt = GETDATE() WHERE id = @id');
        
        console.log('Password updated to hashed version successfully');
      } catch (hashError) {
        console.error('Error updating password to hashed version:', hashError);
        // Continue with login even if hashing fails
      }
    }
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    console.log('Login successful for user:', email);
    
    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
};

// Register user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
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
    
    try {
      // Hash password for security
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      console.log('Registration - Password hashed successfully');
      
      // Insert new user
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .input('email', sql.NVarChar, email)
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, 'user')
        .input('isActive', sql.Bit, true)
        .query(`
          INSERT INTO Users (username, email, password, role, isActive)
          OUTPUT INSERTED.*
          VALUES (@username, @email, @password, @role, @isActive)
        `);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = result.recordset[0];
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: userWithoutPassword
      });
    } catch (bcryptError) {
      console.error('Error hashing password:', bcryptError);
      
      // Fallback to storing plain password if bcrypt fails
      console.warn('WARNING: Storing password without hashing due to bcrypt error');
      
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .input('email', sql.NVarChar, email)
        .input('password', sql.NVarChar, password)
        .input('role', sql.NVarChar, 'user')
        .input('isActive', sql.Bit, true)
        .query(`
          INSERT INTO Users (username, email, password, role, isActive)
          OUTPUT INSERTED.*
          VALUES (@username, @email, @password, @role, @isActive)
        `);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = result.recordset[0];
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: userWithoutPassword
      });
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    // This assumes you have middleware that sets req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT * FROM Users WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = result.recordset[0];
    
    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message
    });
  }
};