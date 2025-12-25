const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const Farmer = require('../models/Farmer');
const authMiddleware = require('../auth'); // This should point to C:\agro-smart-farming\agro-smart-farming\auth.js

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console(),
  ],
});

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Standardized error response
const sendError = (res, status, message, error = null) => {
  logger.error(message, { error: error?.message });
  res.status(status).json({ success: false, message, error: error?.message });
};

// Signup route
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phoneNumber').matches(/^\+91[0-9]{10}$/).withMessage('Invalid phone number, use format +919876543210'),
    body('district').trim().notEmpty().withMessage('District is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed for signup', { errors: errors.array() });
      return sendError(res, 400, 'Validation failed', errors.array());
    }

    const { name, phoneNumber, district } = req.body;
    logger.info('Received signup request', { name, phoneNumber, district });

    try {
      let farmer = await Farmer.findOne({ phoneNumber });
      if (farmer) {
        logger.warn('Farmer already exists', { phoneNumber });
        return sendError(res, 400, 'Farmer already exists');
      }

      const otp = generateOTP();
      const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

      farmer = new Farmer({
        name,
        phoneNumber,
        district,
        otp,
        otpExpires,
      });

      await farmer.save();
      logger.info('OTP generated and saved for signup', { phoneNumber, otp });
      res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (err) {
      logger.error('Error during signup', { error: err.message });
      sendError(res, 500, 'Server error during signup', err);
    }
  }
);

// Login route
router.post(
  '/login',
  [
    body('phoneNumber').matches(/^\+91[0-9]{10}$/).withMessage('Invalid phone number, use format +919876543210'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed for login', { errors: errors.array() });
      return sendError(res, 400, 'Validation failed', errors.array());
    }

    const { phoneNumber } = req.body;
    logger.info('Received login request', { phoneNumber });

    try {
      const farmer = await Farmer.findOne({ phoneNumber });
      if (!farmer) {
        logger.warn('Farmer not found for login', { phoneNumber });
        return sendError(res, 400, 'Farmer not found');
      }

      const otp = generateOTP();
      const otpExpires = Date.now() + 10 * 60 * 1000;

      farmer.otp = otp;
      farmer.otpExpires = otpExpires;
      await farmer.save();

      logger.info('OTP generated and saved for login', { phoneNumber, otp });
      res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (err) {
      logger.error('Error during login', { error: err.message });
      sendError(res, 500, 'Server error during login', err);
    }
  }
);

// Verify OTP route
router.post(
  '/verify-otp',
  [
    body('phoneNumber').matches(/^\+91[0-9]{10}$/).withMessage('Invalid phone number, use format +919876543210'),
    body('otp').matches(/^[0-9]{6}$/).withMessage('OTP must be a 6-digit number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed for OTP verification', { errors: errors.array() });
      return sendError(res, 400, 'Validation failed', errors.array());
    }

    const { phoneNumber, otp } = req.body;
    logger.info('Received OTP verification request', { phoneNumber });

    try {
      const farmer = await Farmer.findOne({ phoneNumber });
      if (!farmer) {
        logger.warn('Farmer not found for OTP verification', { phoneNumber });
        return sendError(res, 400, 'Farmer not found');
      }

      if (farmer.otp !== otp || farmer.otpExpires < Date.now()) {
        logger.warn('Invalid or expired OTP', { phoneNumber });
        return sendError(res, 400, 'Invalid or expired OTP');
      }

      farmer.otp = undefined;
      farmer.otpExpires = undefined;
      await farmer.save();

      const token = jwt.sign(
        { id: farmer._id, phoneNumber: farmer.phoneNumber },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      logger.info('OTP verified successfully', { phoneNumber });
      res.status(200).json({ success: true, message: 'OTP verified successfully', token });
    } catch (err) {
      logger.error('Error during OTP verification', { error: err.message });
      sendError(res, 500, 'Server error during OTP verification', err);
    }
  }
);

// Get farmer profile (protected route)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.user.id).select('-otp -otpExpires');
    if (!farmer) {
      logger.warn('Farmer not found for profile fetch', { farmerId: req.user.id });
      return sendError(res, 404, 'Farmer not found');
    }
    logger.info('Profile fetched', { farmerId: req.user.id });
    res.status(200).json({ success: true, data: farmer });
  } catch (err) {
    logger.error('Error fetching profile', { error: err.message });
    sendError(res, 500, 'Server error fetching profile', err);
  }
});

module.exports = router;