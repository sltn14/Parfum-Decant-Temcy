const express = require('express');
const router = express.Router();
const {
  getActiveStores, getAllStores, createStore, updateStore, toggleStore
} = require('./store.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');

// Publik (checkout pickup)
router.get('/', getActiveStores);

// Admin
router.get('/admin', authenticate, authorizeAdmin, getAllStores);
router.post('/admin', authenticate, authorizeAdmin, createStore);
router.put('/admin/:id', authenticate, authorizeAdmin, updateStore);
router.put('/admin/:id/toggle', authenticate, authorizeAdmin, toggleStore);

module.exports = router;