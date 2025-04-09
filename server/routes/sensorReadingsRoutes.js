const express = require('express');
const router = express.Router();
const sensorReadingsController = require('../controllers/sensorReadingsController')

// POST endpoint để Arduino gửi dữ liệu cảm biến
router.post('/', sensorReadingsController.addSensorReading);

module.exports = router;
