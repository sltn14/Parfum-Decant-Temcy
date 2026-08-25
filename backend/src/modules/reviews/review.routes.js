const express = require('express');
const router = express.Router();
const { getProductReviews, addReview, updateReview, deleteReview, adminDeleteReview } = require('./review.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');

// Public
router.get('/product/:productId', getProductReviews);

// Customer (butuh login)
router.post('/', authenticate, addReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

// Admin
router.delete('/admin/:id', authenticate, authorizeAdmin, adminDeleteReview);

module.exports = router;