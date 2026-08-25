const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('./user.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const multer = require('multer');
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', upload.single('avatar'), updateProfile);
router.put('/change-password', changePassword);

module.exports = router;