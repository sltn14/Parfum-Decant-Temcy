const express = require('express');
const router = express.Router();
const { chat } = require('./chatbot.controller');

router.post('/', chat);

module.exports = router;