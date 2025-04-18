
const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const deviceRoutes = require('./deviceRoutes');
const locationRoutes = require('./locationRoutes');
const readingRoutes = require('./readingRoutes');
const reportRoutes = require('./reportRoutes');
const thresholdRoutes = require('./thresholdRoutes');
const utilRoutes = require('./utilRoutes');
const userRoutes = require('./userRoutes');
const sensorReadingsRoutes = require('./sensorReadingsRoutes');
const loginRoutes = require('./loginRoutes');

// Root API endpoint
router.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Sensor Monitoring API is running',
    version: '1.0.0' 
  });
});

// Register all routes
router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/locations', locationRoutes);
router.use('/readings', readingRoutes);
router.use('/reports', reportRoutes);
router.use('/thresholds', thresholdRoutes);
router.use('/users', userRoutes);
router.use('/sensorreading', sensorReadingsRoutes);
router.use('/login', loginRoutes); // Direct login endpoint
router.use('/', utilRoutes); // For utility routes like test-connection

module.exports = router;

