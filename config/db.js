require('dotenv').config();
const mongoose = require('mongoose');
const winston = require('winston');

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

let isConnected = false;

const connectDB = async () => {
  // Reuse existing connection if active
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  if (process.env.VERCEL && uri.includes('localhost')) {
    throw new Error('MONGODB_URI is set to localhost. Vercel runs in the cloud and requires a cloud database such as MongoDB Atlas (mongodb+srv://...).');
  }

  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info('MongoDB connected successfully');
    return conn;
  } catch (err) {
    logger.error('MongoDB connection error', { error: err.message });
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw err;
  }
};

module.exports = connectDB;

if (require.main === module) {
  connectDB().then(() => {
    console.log('MongoDB connection verified!');
    process.exit(0);
  });
}
