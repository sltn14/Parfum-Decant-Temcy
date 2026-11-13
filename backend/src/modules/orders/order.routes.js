const express = require('express');
const router = express.Router();
const {
  checkout, getMyOrders, getOrder,
  getAllOrders, updateOrderStatus,
  createPayment, cancelOrder
} = require('./order.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');
// ⚠️ Route spesifik HARUS di atas route dinamis

// Admin routes — di atas supaya tidak tertangkap /:id
router.get('/admin/all', authenticate, authorizeAdmin, getAllOrders);
router.put('/:id/status', authenticate, authorizeAdmin, updateOrderStatus);

// Webhook Midtrans
const { midtransWebhook } = require('./webhook.controller');
router.post('/webhook/midtrans', midtransWebhook);

// Customer routes
router.post('/checkout', authenticate, checkout);
router.get('/my-orders', authenticate, getMyOrders);
router.get('/my-orders/:id', authenticate, getOrder);
router.post('/my-orders/:id/create-payment', authenticate, createPayment);
router.put('/my-orders/:id/cancel', authenticate, cancelOrder);

module.exports = router;