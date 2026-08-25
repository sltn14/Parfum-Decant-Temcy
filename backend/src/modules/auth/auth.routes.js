const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { register, login, logout, getMe, forgotPassword, resetPassword } = require('./auth.controller');
const passport = require('../../config/passport');
const jwt = require('jsonwebtoken');

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google` }),
  (req, res) => {
    const token = jwt.sign(
      { user_id: req.user.user_id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Redirect ke frontend dengan token
    res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?token=${token}`);
  }
);

module.exports = router;