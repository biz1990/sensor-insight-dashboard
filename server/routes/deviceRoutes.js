
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// GET all devices
router.get('/', deviceController.getAllDevices);

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

module.exports = router;
