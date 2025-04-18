/**
 * Login Controller
 * Handles user authentication
 */

const sql = require('mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sqlConfig } = require('../config/db');

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