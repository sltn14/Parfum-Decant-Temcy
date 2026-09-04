const express = require('express');
const router = express.Router();
const {
  checkout, getMyOrders, getOrder, uploadPaymentProof,
  getAllOrders, updateOrderStatus, createPayment, cancelOrder
} = require('./order.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');
const { midtransWebhook } = require('./webhook.controller');
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

// Webhook tidak butuh auth
router.post('/webhook/midtrans', midtransWebhook);

// Semua route di bawah butuh auth
router.use(authenticate);

// Customer
router.post('/checkout', checkout);
router.get('/my-orders', getMyOrders);
router.get('/my-orders/:id', getOrder);
router.post('/my-orders/:id/payment-proof', upload.single('payment_proof'), uploadPaymentProof);
router.post('/my-orders/:id/create-payment', createPayment);
router.put('/my-orders/:id/cancel', cancelOrder);

// Admin
router.get('/', authorizeAdmin, getAllOrders);
router.put('/:id/status', authorizeAdmin, updateOrderStatus);

module.exports = router;