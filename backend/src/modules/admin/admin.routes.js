const express = require('express');
const router = express.Router();
const {
  getDashboard, getUsers, createUser, updateUser,
  toggleUserStatus, getReviews, getSalesReport
} = require('./admin.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');

router.use(authenticate, authorizeAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/reviews', getReviews);
router.get('/sales-report', getSalesReport);

module.exports = router;