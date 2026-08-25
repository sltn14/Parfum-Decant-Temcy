const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user.model');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Register
const register = async (req, res) => {
  try {
    const { full_name, email, password, phone, pref_gender, pref_aroma, pref_longevity } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name, email,
      password: hashedPassword,
      phone: phone || null,
      pref_gender: pref_gender || null,
      pref_aroma: pref_aroma || null,
      pref_longevity: pref_longevity || null
    });
    return res.status(201).json({
      message: 'Registrasi berhasil',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Cek kalau user login via Google (tidak punya password)
    if (!user.password) {
      return res.status(401).json({ message: 'Akun ini terdaftar via Google. Gunakan Login dengan Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.status(200).json({
      message: 'Login berhasil',
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        pref_gender: user.pref_gender,
        pref_aroma: user.pref_aroma,
        pref_longevity: user.pref_longevity
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Logout
const logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logout berhasil' });
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: { exclude: ['password', 'reset_token', 'reset_token_expires'] }
    });
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Selalu return 200 biar tidak bocor info email terdaftar atau tidak
    if (!user) {
      return res.status(200).json({ message: 'Jika email terdaftar, link reset akan dikirim' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await user.update({
      reset_token: resetToken,
      reset_token_expires: resetExpires
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Decant Temcy" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Reset Password - Decant Temcy',
      html: `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #b91c1c;">Reset Password</h2>
          <p>Halo <strong>${user.full_name}</strong>,</p>
          <p>Kamu meminta reset password untuk akun Decant Temcy. Klik tombol di bawah:</p>
          <a href="${resetUrl}" style="
            display: inline-block; padding: 12px 24px;
            background: #b91c1c; color: white;
            border-radius: 8px; text-decoration: none;
            font-weight: bold; margin: 16px 0;
          ">Reset Password</a>
          <p style="color: #666; font-size: 0.85rem;">
            Link berlaku selama <strong>1 jam</strong>.<br/>
            Abaikan email ini jika kamu tidak merasa melakukan request ini.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 0.75rem;">Decant Temcy - Marketplace Parfum Premium</p>
        </div>
      `
    });

    return res.status(200).json({ message: 'Jika email terdaftar, link reset akan dikirim' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ message: 'Token dan password baru wajib diisi' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token tidak valid atau sudah kadaluarsa' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await user.update({
      password: hashed,
      reset_token: null,
      reset_token_expires: null
    });

    return res.status(200).json({ message: 'Password berhasil direset. Silakan login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, logout, getMe, forgotPassword, resetPassword };