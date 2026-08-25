const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllUsers, toggleUserStatus, getAllReviews, getSalesReport } = require('./admin.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');

router.use(authenticate, authorizeAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/reviews', getAllReviews);
router.get('/sales-report', getSalesReport);

module.exports = router;