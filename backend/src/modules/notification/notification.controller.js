const Notification = require('./notification.model');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.user_id },
      order: [['createdAt', 'DESC']],
      limit: 20
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

module.exports = { getNotifications, markAsRead };