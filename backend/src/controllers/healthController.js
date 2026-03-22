const pool = require('../config/db');

async function health(req, res, next) {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'ok',
      db: 'up'
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  health
};
