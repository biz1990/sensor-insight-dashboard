
const express = require('express');
const router = express.Router();
const utilController = require('../controllers/utilController');

// Test database connection - GET endpoint
router.get('/test-connection', utilController.testConnectionGet);

// Test database connection - POST endpoint
router.post('/test-connection', utilController.testConnectionPost);

// Execute a SQL query
router.post('/execute-query', utilController.executeQuery);

module.exports = router;
