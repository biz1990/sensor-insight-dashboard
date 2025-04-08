
const express = require('express');
const router = express.Router();
const readingController = require('../controllers/readingController');

// POST new sensor reading
router.post('/', readingController.createReading);

module.exports = router;
