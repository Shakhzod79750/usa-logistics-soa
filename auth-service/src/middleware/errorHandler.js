const logger = require('../logger');

class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, { stack: err.stack });
  res.status(statusCode).json({
    error: { message: err.message || 'Internal Server Error', details: err.details || undefined, status: statusCode },
  });
}

module.exports = { ApiError, notFoundHandler, errorHandler };
