const express = require('express');
const router = express.Router();
const {
  checkout, getMyOrders, getOrder,
  getAllOrders, updateOrderStatus,
  createPayment, uploadPaymentProof, cancelOrder
} = require('./order.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/payments/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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
router.post('/my-orders/:id/payment-proof', authenticate, upload.single('payment_proof'), uploadPaymentProof);
router.put('/my-orders/:id/cancel', authenticate, cancelOrder);

module.exports = router;