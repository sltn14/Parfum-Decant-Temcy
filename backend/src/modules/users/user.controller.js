const User = require('../auth/user.model');
const bcrypt = require('bcryptjs');
const path = require('path');

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: { exclude: ['password', 'google_id', 'reset_token', 'reset_token_expires'] }
    });
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, username, birth_date, gender, bio, pref_gender, pref_aroma, pref_longevity } = req.body;
    const user = await User.findByPk(req.user.user_id);

    // Cek username unik
    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    await user.update({
      full_name: full_name || user.full_name,
      phone: phone || user.phone,
      username: username || user.username,
      birth_date: birth_date || user.birth_date,
      gender: gender || user.gender,
      bio: bio || user.bio,
      pref_gender: pref_gender || user.pref_gender,
      pref_aroma: pref_aroma || user.pref_aroma,
      pref_longevity: pref_longevity || user.pref_longevity,
      ...(req.file && { avatar: req.file.filename })
    });

    return res.status(200).json({ message: 'Profil berhasil diupdate', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    // current_password dipakai API baru; old_password tetap diterima karena frontend lama memakainya
    const current_password = req.body.current_password ?? req.body.old_password;
    const { new_password } = req.body;
    if (typeof current_password !== 'string' || !current_password || typeof new_password !== 'string' || !new_password) {
      return res.status(400).json({ message: 'Password lama dan baru wajib diisi' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ message: 'Password baru minimal 8 karakter' });
    }
    if (new_password.length > 72) {
      return res.status(400).json({ message: 'Password baru maksimal 72 karakter' });
    }
    const user = await User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    if (!user.password) {
      return res.status(400).json({ message: 'Akun ini terdaftar via Google, gunakan fitur lupa password' });
    }
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password lama salah' });
    if (new_password === current_password) {
      return res.status(400).json({ message: 'Password baru harus berbeda dari password lama' });
    }
    const hashed = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashed });
    return res.status(200).json({ message: 'Password berhasil diubah' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile, changePassword };