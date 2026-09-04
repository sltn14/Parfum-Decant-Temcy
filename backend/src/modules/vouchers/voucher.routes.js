const express = require('express');
const router = express.Router();
const { checkVoucher, createVoucher, getVouchers, updateVoucher, deleteVoucher } = require('./voucher.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');

router.post('/check', authenticate, checkVoucher);
router.get('/admin', authenticate, authorizeAdmin, getVouchers);
router.post('/admin', authenticate, authorizeAdmin, createVoucher);
router.put('/admin/:id', authenticate, authorizeAdmin, updateVoucher);
router.delete('/admin/:id', authenticate, authorizeAdmin, deleteVoucher);

module.exports = router;