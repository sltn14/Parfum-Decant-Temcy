const User = require('../auth/user.model');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Get profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: { exclude: ['password', 'google_id'] }
    });
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    const user = await User.findByPk(req.user.user_id);

    await user.update({
      full_name: full_name || user.full_name,
      phone: phone || user.phone,
      ...(req.file && { avatar: req.file.filename })
    });

    return res.status(200).json({ message: 'Profil berhasil diupdate', user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ message: 'Password lama dan baru wajib diisi' });
    }

    const user = await User.findByPk(req.user.user_id);
    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password lama salah' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashed });

    return res.status(200).json({ message: 'Password berhasil diubah' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile, changePassword };