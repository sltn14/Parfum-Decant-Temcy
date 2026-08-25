const express = require('express');
const router = express.Router();
const { checkout, getMyOrders, getOrder, uploadPaymentProof, getAllOrders, updateOrderStatus, createPayment } = require('./order.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const { midtransWebhook } = require('./webhook.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/payments/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/webhook/midtrans', midtransWebhook);
router.use(authenticate);

// Customer
router.post('/checkout', checkout);
router.get('/my-orders', getMyOrders);
router.get('/my-orders/:id', getOrder);
router.post('/my-orders/:id/payment-proof', upload.single('payment_proof'), uploadPaymentProof);
router.post('/my-orders/:id/create-payment', createPayment);

// Admin
router.get('/', authorizeAdmin, getAllOrders);
router.put('/:id/status', authorizeAdmin, updateOrderStatus);

module.exports = router;