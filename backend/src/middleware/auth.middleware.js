const jwt = require('jsonwebtoken');
const User = require('../modules/auth/user.model');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Ambil token dari header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Fallback ke cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan, silakan login' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.user_id, {
      attributes: { exclude: ['password', 'google_id', 'reset_token', 'reset_token_expires'] }
    });

    if (!user) return res.status(401).json({ message: 'User tidak ditemukan' });
    if (!user.is_active) return res.status(401).json({ message: 'Akun dinonaktifkan' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'sysadmin') {
    return res.status(403).json({ message: 'Akses ditolak. Hanya Admin yang diizinkan.' });
  }
  next();
};

const authorizeSysAdmin = (req, res, next) => {
  if (req.user?.role !== 'sysadmin') {
    return res.status(403).json({ message: 'Akses ditolak. Hanya Administrator Sistem yang diizinkan.' });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin, authorizeSysAdmin };