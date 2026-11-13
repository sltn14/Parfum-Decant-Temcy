const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { register, login, logout, getMe, forgotPassword, resetPassword } = require('./auth.controller');
const passport = require('../../config/passport');
const { isGoogleReady } = require('../../config/passport');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('../../middleware/rateLimit.middleware');

// Batasi percobaan berulang pada endpoint sensitif
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Terlalu banyak percobaan, coba lagi nanti' });
const resetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Terlalu banyak permintaan reset password, coba lagi nanti' });

router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

// Google OAuth routes
const loginError = (res, reason) => res.redirect(`${process.env.CLIENT_URL}/login?error=${reason}`);

router.get('/google', (req, res, next) => {
  if (!isGoogleReady()) return loginError(res, 'google_unavailable');
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!isGoogleReady()) return loginError(res, 'google_unavailable');

  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      return loginError(res, info?.message === 'inactive' ? 'google_inactive' : 'google');
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Redirect ke frontend dengan token
    res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?token=${token}`);
  })(req, res, next);
});

module.exports = router;
