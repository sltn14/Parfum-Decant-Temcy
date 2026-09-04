const express = require('express');
const router = express.Router();
const { getTracking, updateTracking } = require('./tracking.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');

router.get('/:orderId', authenticate, getTracking);
router.post('/', authenticate, authorizeAdmin, updateTracking);

module.exports = router;