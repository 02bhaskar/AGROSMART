require('dotenv').config();
const express = require('express');
const path = require('path');
const winston = require('winston');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const weatherRoutes = require('./routes/weather');
const recommendationRoutes = require('./routes/recommendation');

// Logger setup (console for serverless, file for local)
const transports = [new winston.transports.Console()];
if (!process.env.VERCEL) {
  transports.push(new winston.transports.File({ filename: 'error.log', level: 'error' }));
  transports.push(new winston.transports.File({ filename: 'combined.log' }));
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});

// Validate environment variables
const requiredEnvVars = ['MONGODB_URI', 'OPENWEATHER_API_KEY', 'JWT_SECRET'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    logger.warn(`Missing environment variable: ${varName}`);
  }
});

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/locales', express.static(path.join(__dirname, 'locales')));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/recommendation', recommendationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, message: 'Server error', error: err.message });
});

// Start server if run directly (local), otherwise export app for Vercel serverless
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;