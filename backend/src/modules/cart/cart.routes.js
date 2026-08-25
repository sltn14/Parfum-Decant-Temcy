const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem } = require('./cart.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate); // semua cart route butuh login

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);

module.exports = router;