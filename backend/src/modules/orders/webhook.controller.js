const Order = require('./order.model');
const Notification = require('../notification/notification.model');
const crypto = require('crypto');

const midtransWebhook = async (req, res) => {
  try {
    const {
      order_id, transaction_status, fraud_status,
      gross_amount, signature_key, status_code
    } = req.body;

    // Verifikasi signature Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      return res.status(403).json({ message: 'Invalid signature' });
    }

    // Ambil order_code dari order_id Midtrans (format: TM-YYYYMMDD-XXXX-timestamp)
    const orderCode = order_id.split('-').slice(0, 3).join('-');
    const order = await Order.findOne({ where: { order_code: orderCode } });

    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

    // Update status berdasarkan response Midtrans
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || transaction_status === 'settlement') {
        await order.update({ status: 'paid', paid_at: new Date() });

        // Kirim notifikasi ke user
        await Notification.create({
          user_id: order.user_id,
          title: 'Pembayaran Berhasil!',
          message: `Pembayaran untuk pesanan ${order.order_code} berhasil dikonfirmasi. Pesanan sedang diproses.`,
          type: 'order'
        });
      }
    } else if (transaction_status === 'pending') {
      await order.update({ status: 'pending' });
    } else if (['deny', 'expire', 'cancel'].includes(transaction_status)) {
      await order.update({ status: 'cancelled' });

      await Notification.create({
        user_id: order.user_id,
        title: 'Pembayaran Gagal',
        message: `Pembayaran untuk pesanan ${order.order_code} gagal atau kadaluarsa.`,
        type: 'order'
      });
    }

    return res.status(200).json({ message: 'Webhook processed' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { midtransWebhook };