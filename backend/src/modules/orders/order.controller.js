const Order = require('./order.model');
const OrderItem = require('./order_item.model');
const Cart = require('../cart/cart.model');
const CartItem = require('../cart/cart_item.model');
const Product = require('../products/product.model');
const { snap } = require('../../config/midtrans');
const { sendOrderEmail } = require('../../utils/emailHelper');
const { restoreStockMl, adjustVials } = require('../../utils/stockMl');

// Generate order code
const generateOrderCode = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TM-${dateStr}-${random}`;
};

// Checkout
const checkout = async (req, res) => {
  try {
    const {
      shipping_name, shipping_phone, shipping_address, shipping_city, shipping_notes,
      delivery_method = 'delivery',
      courier, courier_service, shipping_cost = 0,
      voucher_code, address_id, pickup_store_id
    } = req.body;

    if (delivery_method === 'delivery' && !address_id) {
      if (!shipping_name || !shipping_phone || !shipping_address || !shipping_city) {
        return res.status(400).json({ message: 'Data pengiriman wajib diisi' });
      }
    }

    const cart = await Cart.findOne({
      where: { user_id: req.user.user_id },
      include: [{ model: CartItem, as: 'items' }]
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Keranjang kosong' });
    }

    // Cek stok vial cukup per produk + ukuran
    const need = {};
    for (const item of cart.items) {
      const k = `${item.product_id}:${parseInt(item.size_ml)}`;
      need[k] = (need[k] || 0) + item.quantity;
    }
    for (const [k, qty] of Object.entries(need)) {
      const [productId, size] = k.split(':');
      const p = await Product.findByPk(productId);
      const have = p ? (parseInt(p[`stock_${size}ml`]) || 0) : 0;
      if (!p || qty > have) {
        return res.status(400).json({
          message: `Stok ${p ? p.product_name : 'produk'} ${size}ml tidak cukup (sisa ${have} pcs)`
        });
      }
    }

    // Pickup: tentukan store tujuan (dicek sebelum voucher dipakai)
    let pickupStore = null;
    if (delivery_method === 'pickup') {
      const Store = require('../stores/store.model');
      pickupStore = pickup_store_id
        ? await Store.findOne({ where: { store_id: pickup_store_id, is_active: true } })
        : await Store.findOne({ where: { is_active: true }, order: [['store_id', 'ASC']] });
      if (!pickupStore) {
        return res.status(400).json({
          message: pickup_store_id
            ? 'Store pickup tidak ditemukan atau sedang tidak aktif'
            : 'Belum ada store aktif untuk pickup'
        });
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let discount_amount = 0;
    if (voucher_code) {
      const Voucher = require('../vouchers/voucher.model');
      const { Op } = require('sequelize');
      const voucher = await Voucher.findOne({
        where: {
          code: voucher_code.toUpperCase(),
          is_active: true,
          [Op.or]: [{ expired_at: null }, { expired_at: { [Op.gt]: new Date() } }]
        }
      });
      if (voucher && voucher.used_count < voucher.quota && subtotal >= voucher.min_purchase) {
        if (voucher.type === 'percentage') {
          discount_amount = Math.floor(subtotal * (voucher.value / 100));
          if (voucher.max_discount) discount_amount = Math.min(discount_amount, voucher.max_discount);
        } else {
          discount_amount = voucher.value;
        }
        await voucher.increment('used_count');
      }
    }

    const total_price = subtotal + parseInt(shipping_cost) - discount_amount;

    let shippingData = {
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_notes: shipping_notes || ''
    };

    if (address_id) {
      const Address = require('../addresses/address.model');
      const addr = await Address.findOne({ where: { address_id, user_id: req.user.user_id } });
      if (addr) {
        shippingData = {
          shipping_name: addr.recipient_name,
          shipping_phone: addr.phone,
          shipping_address: addr.detail,
          shipping_city: addr.city,
          shipping_notes: shipping_notes || ''
        };
      } else {
        return res.status(400).json({ message: 'Alamat tidak ditemukan' });
      }
    }

    if (delivery_method === 'pickup') {
      const User = require('../auth/user.model');
      const user = await User.findByPk(req.user.user_id);
      shippingData = {
        shipping_name: user.full_name,
        shipping_phone: user.phone || '-',
        shipping_address: `Pickup di ${pickupStore.name} — ${pickupStore.address}`,
        shipping_city: pickupStore.city,
        shipping_notes: ''
      };
    }

    const order = await Order.create({
      user_id: req.user.user_id,
      order_code: generateOrderCode(),
      total_price,
      ...shippingData,
      delivery_method,
      pickup_store_id: pickupStore ? pickupStore.store_id : null,
      courier: delivery_method === 'delivery' ? courier : null,
      courier_service: delivery_method === 'delivery' ? courier_service : null,
      shipping_cost: delivery_method === 'delivery' ? parseInt(shipping_cost) : 0,
      voucher_code: voucher_code || null,
      discount_amount
    });

    for (const item of cart.items) {
      const product = await Product.findByPk(item.product_id);
      await OrderItem.create({
        order_id: order.order_id,
        product_id: item.product_id,
        product_name: product.product_name,
        brand: product.brand,
        size_ml: item.size_ml,
        quantity: item.quantity,
        price: item.price
      });

      // Kurangi stok vial ukuran yang dibeli, stock_ml ikut dihitung ulang otomatis
      await adjustVials(product, item.size_ml, -item.quantity, item.quantity);
    }

    await CartItem.destroy({ where: { cart_id: cart.cart_id } });

    return res.status(201).json({ message: 'Order berhasil dibuat', order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get my orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.user_id },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ orders });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { order_id: req.params.id, user_id: req.user.user_id },
      include: [{ model: OrderItem, as: 'items' }]
    });
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });
    return res.status(200).json({ order });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Cancel Order
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { order_id: req.params.id, user_id: req.user.user_id },
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

    if (order.status !== 'pending') {
      return res.status(400).json({
        message: 'Hanya pesanan dengan status menunggu pembayaran yang dapat dibatalkan'
      });
    }

    await order.update({ status: 'cancelled' });
    await restoreStockMl(order.items);

    // Notifikasi in-app
    try {
      const Notification = require('../notification/notification.model');
      const notif = await Notification.create({
        user_id: order.user_id,
        title: 'Pesanan Dibatalkan',
        message: `Pesanan ${order.order_code} berhasil dibatalkan.`,
        type: 'order'
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${order.user_id}`).emit('notification', {
          notification_id: notif.notification_id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          is_read: false,
          createdAt: notif.createdAt
        });
      }
    } catch (notifErr) {
      console.error('Notif error:', notifErr.message);
    }

    // Kirim email
    try {
      const User = require('../auth/user.model');
      const user = await User.findByPk(order.user_id, { attributes: ['email', 'full_name'] });
      if (user) {
        await sendOrderEmail(order, 'cancelled', user.email, user.full_name);
      }
    } catch (emailErr) {
      console.error('Email error:', emailErr.message);
    }

    return res.status(200).json({ message: 'Pesanan berhasil dibatalkan', order });
  } catch (err) {
    console.error('cancelOrder error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Generate Midtrans payment token
const createPayment = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { order_id: req.params.id, user_id: req.user.user_id },
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order sudah dibayar' });
    }

    const User = require('../auth/user.model');
    const user = await User.findByPk(req.user.user_id);

    const parameter = {
      transaction_details: {
        order_id: `${order.order_code}-${Date.now()}`,
        gross_amount: order.total_price
      },
      customer_details: {
        first_name: user.full_name,
        email: user.email,
        phone: user.phone || '08000000000'
      },
      item_details: order.items.map(item => ({
        id: String(item.product_id),
        price: item.price,
        quantity: item.quantity,
        name: `${item.product_name} (${item.size_ml}ml)`
      })),
      enabled_payments: ['other_qris', 'gopay']
    };

    const transaction = await snap.createTransaction(parameter);

    return res.status(200).json({
      snap_token: transaction.token,
      redirect_url: transaction.redirect_url
    });
  } catch (err) {
    console.error('Midtrans error:', err);
    return res.status(500).json({ message: 'Gagal membuat pembayaran' });
  }
};

// Upload bukti pembayaran
const uploadPaymentProof = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { order_id: req.params.id, user_id: req.user.user_id }
    });
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order sudah diproses' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'File bukti pembayaran wajib diupload' });
    }

    await order.update({
      payment_proof: req.file.filename,
      status: 'paid',
      paid_at: new Date()
    });

    return res.status(200).json({ message: 'Bukti pembayaran berhasil diupload' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin: get all orders
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = status ? { status } : {};
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({ total: count, orders: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin: update status order
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }]
    });
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

    const previousStatus = order.status;
    await order.update({ status });

    // Admin membatalkan order -> kembalikan stok ml (sekali saja)
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      await restoreStockMl(order.items);
    }

    const Notification = require('../notification/notification.model');
    const statusMessages = {
      paid: { title: 'Pembayaran Dikonfirmasi', message: `Pembayaran pesanan ${order.order_code} telah dikonfirmasi admin.` },
      processing: { title: 'Pesanan Diproses', message: `Pesanan ${order.order_code} sedang diproses oleh tim kami.` },
      shipped: { title: 'Pesanan Dikirim!', message: `Pesanan ${order.order_code} telah dikirim. Segera sampai di tangan kamu!` },
      delivered: { title: 'Pesanan Selesai', message: `Pesanan ${order.order_code} telah diterima. Terima kasih telah berbelanja!` },
      cancelled: { title: 'Pesanan Dibatalkan', message: `Pesanan ${order.order_code} telah dibatalkan.` }
    };

    if (statusMessages[status]) {
      // Notifikasi in-app
      try {
        const notif = await Notification.create({
          user_id: order.user_id,
          title: statusMessages[status].title,
          message: statusMessages[status].message,
          type: 'order'
        });

        const io = req.app.get('io');
        if (io) {
          io.to(`user_${order.user_id}`).emit('notification', {
            notification_id: notif.notification_id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            is_read: false,
            createdAt: notif.createdAt
          });
        }
      } catch (notifErr) {
        console.error('Notif error:', notifErr.message);
      }

      // Kirim email
      try {
        const User = require('../auth/user.model');
        const user = await User.findByPk(order.user_id, { attributes: ['email', 'full_name'] });
        if (user) {
          await sendOrderEmail(order, status, user.email, user.full_name);
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr.message);
      }
    }

    return res.status(200).json({ message: 'Status order berhasil diupdate', order });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  checkout, getMyOrders, getOrder, uploadPaymentProof,
  getAllOrders, updateOrderStatus, createPayment, cancelOrder
};