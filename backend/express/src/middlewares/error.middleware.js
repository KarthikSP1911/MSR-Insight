
import logger from '../utils/logger.js';
const errorHandler = (err, req, res, next) => {
  logger.error("Error:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;