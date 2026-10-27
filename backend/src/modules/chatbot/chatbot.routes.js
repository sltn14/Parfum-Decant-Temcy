const express = require('express');
const router = express.Router();
const { chat, resetSession } = require('./chatbot.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.post('/', authenticate, chat);
router.post('/reset', authenticate, resetSession); // tambah ini

module.exports = router;