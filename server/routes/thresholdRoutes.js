
const express = require('express');
const router = express.Router();
const thresholdController = require('../controllers/thresholdController');

// GET all warning thresholds
router.get('/', thresholdController.getThresholds);

// POST/Update warning thresholds
router.post('/', thresholdController.updateThresholds);

module.exports = router;
