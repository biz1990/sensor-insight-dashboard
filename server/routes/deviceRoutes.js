
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// GET all devices
router.get('/', deviceController.getAllDevices);

// GET devices with their latest readings
router.get('/with-readings', deviceController.getDevicesWithLatestReadings);

// GET device by ID
router.get('/:id', deviceController.getDeviceById);

// POST new device
router.post('/', deviceController.createDevice);

// PUT update device
router.put('/:id', deviceController.updateDevice);

// DELETE device
router.delete('/:id', deviceController.deleteDevice);

// GET sensor readings for a device
router.get('/:id/readings', deviceController.getDeviceReadings);

router.get('/:id/readings/latest', deviceController.getLatestReadings);
router.get('/:id/readings/daily', deviceController.getDailyReadings);
router.get('/:id/readings/range', deviceController.getRangeReadings);

module.exports = router;
