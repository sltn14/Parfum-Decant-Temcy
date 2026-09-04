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
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ message: 'Password lama dan baru wajib diisi' });
    }
    const user = await User.findByPk(req.user.user_id);
    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password lama salah' });
    const hashed = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashed });
    return res.status(200).json({ message: 'Password berhasil diubah' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile, changePassword };