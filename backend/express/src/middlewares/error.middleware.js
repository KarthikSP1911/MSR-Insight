
import logger from '../utils/logger.js';
const errorHandler = (err, req, res, next) => {
  // Pass the Error object itself (not just err.message) so the logger's
  // errors({stack:true}) format can print a stack trace -- a bare message
  // string shows only "what" broke, never "where".
  logger.error(`Error handling ${req.method} ${req.originalUrl}:`, err);

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;