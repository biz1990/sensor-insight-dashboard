const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// GET generate report for a device
router.get('/devices/:deviceId', reportController.generateDeviceReport);

// GET statistics for a device
router.get('/devices/:deviceId/stats', reportController.getDeviceStats);

module.exports = router;