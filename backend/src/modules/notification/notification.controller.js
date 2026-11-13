const Notification = require('./notification.model');

const getNotifications = async (req, res) => {
  try {
    // Dibatasi: default 50 terbaru, maksimum 100 (?limit=)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const notifications = await Notification.findAll({
      where: { user_id: req.user.user_id },
      order: [['createdAt', 'DESC']],
      limit
    });
    return res.status(200).json({ notifications });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.user_id, is_read: false } }
    );
    return res.status(200).json({ message: 'Notifikasi ditandai sudah dibaca' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Tandai satu notifikasi (milik sendiri) sudah dibaca
const markOneAsRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID notifikasi tidak valid' });
    const [updated] = await Notification.update(
      { is_read: true },
      { where: { notification_id: id, user_id: req.user.user_id } }
    );
    if (!updated) {
      // Sudah terbaca atau bukan milik pengguna: cek keberadaannya supaya 404 hanya untuk yang tidak ada/bukan milik
      const exists = await Notification.findOne({ where: { notification_id: id, user_id: req.user.user_id } });
      if (!exists) return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
    }
    return res.status(200).json({ message: 'Notifikasi ditandai sudah dibaca' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications, markAsRead, markOneAsRead };