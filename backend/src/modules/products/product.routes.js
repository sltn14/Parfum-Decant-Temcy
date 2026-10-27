const express = require('express')
const router = express.Router()
const {
  getProducts, getProduct, createProduct,
  updateProduct, deleteProduct, updateStock, getAllProductsAdmin
} = require('./product.controller')
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware')
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/products/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Format file tidak didukung'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB untuk foto produk
})

// ⚠️ PENTING: route spesifik HARUS di atas route dinamis /:id
router.get('/admin/all', authenticate, authorizeAdmin, getAllProductsAdmin)

// Public
router.get('/', getProducts)
router.get('/:id', getProduct)

// Admin
router.post('/', authenticate, authorizeAdmin, upload.single('image'), createProduct)
router.put('/:id', authenticate, authorizeAdmin, upload.single('image'), updateProduct)
router.delete('/:id', authenticate, authorizeAdmin, deleteProduct)
router.patch('/:id/stock', authenticate, authorizeAdmin, updateStock)

module.exports = router