
const express = require('express');
const router = express.Router();

// Import all route modules
const deviceRoutes = require('./deviceRoutes');
const locationRoutes = require('./locationRoutes');
const readingRoutes = require('./readingRoutes');
const thresholdRoutes = require('./thresholdRoutes');
const utilRoutes = require('./utilRoutes');
const userRoutes = require('./userRoutes');
const sensorReadingsRoutes = require('./sensorReadingsRoutes'); // Đường dẫn đến file sensorReadingsRoutes.js

// Root API endpoint
router.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Sensor Monitoring API is running',
    version: '1.0.0' 
  });
});

// Register all routes
router.use('/devices', deviceRoutes);
router.use('/locations', locationRoutes);
router.use('/readings', readingRoutes);
router.use('/thresholds', thresholdRoutes);
router.use('/users', userRoutes);
//app.use('/api', sensorReadingsRoutes); // Đặt tiền tố /api cho các routes
router.use('/sensorreading',sensorReadingsRoutes);
router.use('/', utilRoutes); // For utility routes like test-connection

module.exports = router;

