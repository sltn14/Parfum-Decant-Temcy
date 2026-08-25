const express = require('express');
const router = express.Router();
const {
  getPopular,
  getByGender,
  getSimilar,
  getPersonalized,
  getByConcentration
} = require('./recommendation.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Public
router.get('/popular', getPopular);
router.get('/gender/:gender', getByGender);
router.get('/similar/:productId', getSimilar);
router.get('/concentration/:concentration', getByConcentration);

// Butuh login (personalized)
router.get('/personalized', authenticate, getPersonalized);

module.exports = router;