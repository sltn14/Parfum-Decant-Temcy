const express = require('express');
const router = express.Router();
const { getFavorites, toggleFavorite, checkFavorite } = require('./favorite.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getFavorites);
router.post('/toggle', toggleFavorite);
router.get('/check/:productId', checkFavorite);

module.exports = router;