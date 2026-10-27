const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('./user.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Format foto tidak didukung. Gunakan JPG, JPEG, atau PNG'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Ukuran foto terlalu besar, maksimum 2 MB' })
      }
      return res.status(400).json({ message: err.message })
    } else if (err) {
      return res.status(400).json({ message: err.message })
    }
    next()
  })
}, updateProfile);
router.put('/change-password', changePassword);

module.exports = router;