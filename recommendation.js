const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const NodeCache = require('node-cache');
const axios = require('axios');
const authMiddleware = require('../auth');
const Farmer = require('../models/Farmer'); // Ensure Farmer model is imported

const cache = new NodeCache({ stdTTL: 3600 });

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

// Standardized error response
const sendError = (res, status, message, error = null) => {
  logger.error(message, { error: error?.message });
  res.status(status).json({ success: false, message, error: error?.message });
};

// Crop recommendation logic based on soil type and climate
const getCropRecommendations = (soilType, climateData) => {
  const { temperature, humidity } = climateData;
  const season = temperature > 30 ? 'Summer' : temperature < 20 ? 'Winter' : 'Monsoon';

  const recommendations = {
    crops: [],
    fertilizers: [],
    profit: 0,
    reason: '',
  };

  if (soilType === 'Sandy') {
    recommendations.crops = ['Millets', 'Groundnuts'];
    recommendations.fertilizers = ['Urea', 'Potash'];
    recommendations.profit = 50000;
    recommendations.reason = 'Sandy soil drains quickly, suitable for drought-resistant crops like millets.';
  } else if (soilType === 'Clay') {
    recommendations.crops = ['Rice', 'Wheat'];
    recommendations.fertilizers = ['Compost', 'Phosphate'];
    recommendations.profit = 60000;
    recommendations.reason = 'Clay soil retains water, ideal for rice and wheat.';
  } else if (soilType === 'Loamy') {
    recommendations.crops = ['Maize', 'Vegetables'];
    recommendations.fertilizers = ['NPK', 'Organic Compost'];
    recommendations.profit = 70000;
    recommendations.reason = 'Loamy soil is fertile and well-balanced, good for a variety of crops.';
  } else if (soilType === 'Silty') {
    recommendations.crops = ['Barley', 'Potatoes'];
    recommendations.fertilizers = ['Potash', 'Lime'];
    recommendations.profit = 55000;
    recommendations.reason = 'Silty soil is smooth and retains moisture, suitable for barley and potatoes.';
  } else if (soilType === 'Peaty') {
    recommendations.crops = ['Berries', 'Pasture Grass'];
    recommendations.fertilizers = ['Lime', 'Phosphate'];
    recommendations.profit = 45000;
    recommendations.reason = 'Peaty soil is acidic and organic-rich, good for berries and grasses.';
  } else {
    recommendations.reason = 'Unknown soil type.';
  }

  if (temperature > 35 || humidity < 20) {
    recommendations.crops = recommendations.crops.map(crop => `${crop} (with irrigation)`);
    recommendations.reason += ' High temperature or low humidity requires irrigation.';
  }

  return { recommendations, season };
};

// Recommendation route
router.post(
  '/',
  authMiddleware,
  [
    body('soilType').isIn(['Sandy', 'Clay', 'Loamy', 'Silty', 'Peaty']).withMessage('Invalid soil type'),
    body('acres').isFloat({ min: 0.01 }).withMessage('Acres must be a positive number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed for recommendation', { errors: errors.array(), body: req.body });
      return sendError(res, 400, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '), errors.array());
    }

    const { soilType, acres } = req.body;
    logger.info('Received recommendation request', { soilType, acres, userId: req.user.id });

    try {
      const cacheKey = `weather_${req.user.phoneNumber}`;
      let climateData = cache.get(cacheKey);

      if (!climateData) {
        const farmer = await Farmer.findById(req.user.id);
        if (!farmer) {
          logger.warn('Farmer not found for recommendation', { farmerId: req.user.id });
          return sendError(res, 404, 'Farmer not found');
        }

        try {
          logger.info('Fetching weather data for district:', farmer.district);
          const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${farmer.district}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
          );
          logger.info('Weather API response:', weatherResponse.data);
          
          climateData = {
            temperature: weatherResponse.data.main.temp,
            humidity: weatherResponse.data.main.humidity,
          };
          cache.set(cacheKey, climateData);
        } catch (weatherError) {
          logger.warn('Failed to fetch weather data, using fallback climate data', { error: weatherError.message, district: farmer.district });
          climateData = {
            temperature: 25, // Mock temperature
            humidity: 60,   // Mock humidity
          };
          cache.set(cacheKey, climateData);
        }
      }

      const { recommendations, season } = getCropRecommendations(soilType, climateData);
      recommendations.profit = Math.round(recommendations.profit * acres);

      logger.info('Recommendation generated', { soilType, acres, recommendations });
      res.status(200).json({
        success: true,
        soilType,
        climateData,
        season,
        recommendations,
      });
    } catch (err) {
      logger.error('Error generating recommendation', { error: err.message, stack: err.stack });
      sendError(res, 500, 'Server error generating recommendation: ' + err.message, err);
    }
  }
);

module.exports = router;