const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST login
router.post('/login', authController.login);

// POST register
router.post('/register', authController.register);

// GET current user (protected route)
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;