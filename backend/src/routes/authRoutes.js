const express = require('express');
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', loginLimiter, authController.login);

module.exports = router;
