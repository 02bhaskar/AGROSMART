const jwt = require('jsonwebtoken');
const winston = require('winston');

// Logger setup (console for serverless, file for local)
const transports = [new winston.transports.Console()];
if (!process.env.VERCEL) {
  transports.push(new winston.transports.File({ filename: 'error.log', level: 'error' }));
  transports.push(new winston.transports.File({ filename: 'combined.log' }));
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports,
});

// Standardized error response
const sendError = (res, status, message, error = null) => {
  logger.error(message, { error: error?.message });
  res.status(status).json({ success: false, message, error: error?.message });
};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    logger.warn('No token provided', { path: req.path });
    return sendError(res, 401, 'No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.info('Token verified', { userId: decoded.id });
    next();
  } catch (err) {
    logger.error('Invalid token', { error: err.message });
    return sendError(res, 401, 'Invalid token', err);
  }
};

module.exports = authMiddleware;