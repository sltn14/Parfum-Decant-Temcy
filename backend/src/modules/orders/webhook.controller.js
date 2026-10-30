const Order = require('./order.model');
const OrderItem = require('./order_item.model');
const Notification = require('../notification/notification.model');
const User = require('../auth/user.model');
const { sendOrderEmail } = require('../../utils/emailHelper');
const { restoreStockMl } = require('../../utils/stockMl');
const crypto = require('crypto');

const midtransWebhook = async (req, res) => {
  try {
    let body = req.body;

    // Parse kalau masih raw buffer
    if (Buffer.isBuffer(body)) {
      body = JSON.parse(body.toString());
    } else if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      signature_key,
      status_code
    } = body;

    // Verifikasi signature Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      console.error('Invalid Midtrans signature');
      return res.status(403).json({ message: 'Invalid signature' });
    }

    // order_id format dari Midtrans: "TM-20241201-1234-1701234567890"
    // order_code di DB: "TM-20241201-1234"
    const parts = order_id.split('-');
    const orderCode = parts.slice(0, 3).join('-');

    console.log('Webhook received:', { order_id, orderCode, transaction_status, fraud_status });

    const order = await Order.findOne({
      where: { order_code: orderCode },
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      console.error('Order tidak ditemukan:', orderCode);
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    // Ambil data user untuk email
    const user = await User.findByPk(order.user_id, {
      attributes: ['email', 'full_name']
    });

    // Helper emit socket
    const emitNotif = (app, userId, notif) => {
      try {
        const io = app?.get?.('io');
        if (io) {
          io.to(`user_${userId}`).emit('notification', {
            notification_id: notif.notification_id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            is_read: false,
            createdAt: notif.createdAt
          });
        }
      } catch (e) {
        console.error('Socket emit error:', e.message);
      }
    };

    if (
      transaction_status === 'capture' ||
      transaction_status === 'settlement'
    ) {
      if (
        fraud_status === 'accept' ||
        transaction_status === 'settlement'
      ) {
        // Jangan update kalau sudah paid
        if (order.status === 'pending') {
          await order.update({ status: 'paid', paid_at: new Date() });

          // Notifikasi in-app
          try {
            const notif = await Notification.create({
              user_id: order.user_id,
              title: 'Pembayaran Berhasil!',
              message: `Pembayaran pesanan ${order.order_code} berhasil dikonfirmasi via QRIS.`,
              type: 'order'
            });
            emitNotif(req.app, order.user_id, notif);
          } catch (e) {
            console.error('Notif error:', e.message);
          }

          // Kirim email
          if (user) {
            await sendOrderEmail(order, 'paid', user.email, user.full_name);
          }
        }
      }
    } else if (transaction_status === 'pending') {
      // Tidak perlu update, order sudah pending
      console.log('Transaksi masih pending:', orderCode);
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'expire' ||
      transaction_status === 'cancel'
    ) {
      if (order.status === 'pending') {
        await order.update({ status: 'cancelled' });
        await restoreStockMl(order.items);

        // Notifikasi in-app
        try {
          const notif = await Notification.create({
            user_id: order.user_id,
            title: 'Pembayaran Gagal',
            message: `Pembayaran pesanan ${order.order_code} gagal atau kedaluwarsa.`,
            type: 'order'
          });
          emitNotif(req.app, order.user_id, notif);
        } catch (e) {
          console.error('Notif error:', e.message);
        }

        // Kirim email
        if (user) {
          await sendOrderEmail(order, 'cancelled', user.email, user.full_name);
        }
      }
    }

    return res.status(200).json({ message: 'Webhook processed' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { midtransWebhook };