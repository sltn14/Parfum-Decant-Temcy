const express = require('express');
const router = express.Router();
const { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } = require('./address.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/set-default', setDefaultAddress);

module.exports = router;