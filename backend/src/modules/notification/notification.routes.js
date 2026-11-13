const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markOneAsRead } = require('./notification.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getNotifications);
router.put('/read-all', markAsRead);
router.put('/:id/read', markOneAsRead);

module.exports = router;