const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController.improved');

/**
 * @route   GET /api/devices
 * @desc    Get all devices
 * @access  Public
 */
router.get('/', deviceController.getAllDevices);

/**
 * @route   GET /api/devices/with-readings
 * @desc    Get devices with their latest readings
 * @access  Public
 */
router.get('/with-readings', deviceController.getDevicesWithLatestReadings);

/**
 * @route   GET /api/devices/:id
 * @desc    Get device by ID
 * @access  Public
 */
router.get('/:id', deviceController.getDeviceById);

/**
 * @route   POST /api/devices
 * @desc    Create a new device
 * @access  Public
 */
router.post('/', deviceController.createDevice);

/**
 * @route   PUT /api/devices/:id
 * @desc    Update an existing device
 * @access  Public
 */
router.put('/:id', deviceController.updateDevice);

/**
 * @route   DELETE /api/devices/:id
 * @desc    Delete a device
 * @access  Public
 */
router.delete('/:id', deviceController.deleteDevice);

/**
 * @route   GET /api/devices/:id/readings
 * @desc    Get readings for a device (default: last 24 hours)
 * @access  Public
 */
router.get('/:id/readings', deviceController.getDeviceReadings);

/**
 * @route   GET /api/devices/:id/readings/latest
 * @desc    Get latest 10 readings for a device
 * @access  Public
 */
router.get('/:id/readings/latest', deviceController.getLatestReadings);

/**
 * @route   GET /api/devices/:id/readings/daily
 * @desc    Get readings for the current day
 * @access  Public
 */
router.get('/:id/readings/daily', deviceController.getDailyReadings);

/**
 * @route   GET /api/devices/:id/readings/range
 * @desc    Get readings for a specified date range
 * @access  Public
 */
router.get('/:id/readings/range', deviceController.getRangeReadings);

module.exports = router;