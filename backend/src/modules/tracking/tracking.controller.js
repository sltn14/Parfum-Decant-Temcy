const OrderTracking = require('./tracking.model');
const Order = require('../orders/order.model');

const getTracking = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { order_id: req.params.orderId, user_id: req.user.user_id },
      include: [{ model: OrderTracking, as: 'tracking' }]
    });
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });
    return res.status(200).json({ tracking: order.tracking });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin update tracking
const updateTracking = async (req, res) => {
  try {
    const { order_id, courier, tracking_number, status, description, location } = req.body;
    let tracking = await OrderTracking.findOne({ where: { order_id } });
    if (tracking) {
      await tracking.update({ courier, tracking_number, status, description, location });
    } else {
      tracking = await OrderTracking.create({ order_id, courier, tracking_number, status, description, location });
    }

    // Update nomor resi di order
    await Order.update({ tracking_number }, { where: { order_id } });

    return res.status(200).json({ message: 'Tracking diupdate', tracking });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTracking, updateTracking };