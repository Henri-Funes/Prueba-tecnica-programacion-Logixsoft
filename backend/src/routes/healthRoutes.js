const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

// GET /api/health
router.get('/', healthController.health);

module.exports = router;
