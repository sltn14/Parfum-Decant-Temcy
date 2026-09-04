const express = require('express');
const router = express.Router();
const { provinces, cities, cost } = require('./shipping.controller');

router.get('/provinces', provinces);
router.get('/cities/:provinceId', cities);
router.post('/cost', cost);

module.exports = router;