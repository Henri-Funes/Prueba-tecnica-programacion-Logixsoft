const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
  }
});

module.exports = {
  loginLimiter
};
