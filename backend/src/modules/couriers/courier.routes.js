const express = require('express');
const router = express.Router();
const { getActiveCouriers, getAllCouriers, createCourier, updateCourier, deleteCourier } = require('./courier.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');

// Publik (checkout): kurir aktif saja
router.get('/', getActiveCouriers);

// Admin
router.get('/admin', authenticate, authorizeAdmin, getAllCouriers);
router.post('/admin', authenticate, authorizeAdmin, createCourier);
router.put('/admin/:id', authenticate, authorizeAdmin, updateCourier);
router.delete('/admin/:id', authenticate, authorizeAdmin, deleteCourier);

module.exports = router;
