function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  return res.status(status).json({ message });
}

module.exports = errorHandler;
