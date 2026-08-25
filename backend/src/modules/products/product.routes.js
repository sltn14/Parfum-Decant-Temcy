const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('./product.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/products/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Public
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin only
router.post('/', authenticate, authorizeAdmin, upload.single('image'), createProduct);
router.put('/:id', authenticate, authorizeAdmin, upload.single('image'), updateProduct);
router.delete('/:id', authenticate, authorizeAdmin, deleteProduct);

module.exports = router;