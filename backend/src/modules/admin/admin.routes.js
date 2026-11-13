const express = require('express');
const router = express.Router();
const {
  getDashboard, getReviews, getSalesReport
} = require('./admin.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');

router.use(authenticate, authorizeAdmin);

router.get('/dashboard', getDashboard);
router.get('/reviews', getReviews);
router.get('/sales-report', getSalesReport);

module.exports = router;