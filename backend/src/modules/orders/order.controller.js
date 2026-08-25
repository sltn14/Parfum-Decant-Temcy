const Order = require('./order.model');
const OrderItem = require('./order_item.model');
const Cart = require('../cart/cart.model');
const CartItem = require('../cart/cart_item.model');
const Product = require('../products/product.model');
const { snap } = require('../../config/midtrans');

// Generate order code
const generateOrderCode = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TM-${dateStr}-${random}`;
};

// Checkout (buat order dari cart)
const checkout = async (req, res) => {
  try {
    const { shipping_name, shipping_phone, shipping_address, shipping_city, shipping_notes } = req.body;

    if (!shipping_name || !shipping_phone || !shipping_address || !shipping_city) {
      return res.status(400).json({ message: 'Data pengiriman wajib diisi' });
    }

    const cart = await Cart.findOne({
      where: { user_id: req.user.user_id },
      include: [{ model: CartItem, as: 'items' }]
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Keranjang kosong' });
    }

    const total_price = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = await Order.create({
      user_id: req.user.user_id,
      order_code: generateOrderCode(),
      total_price,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_notes
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
      enabled_payments: ['qris']
    };

    const transaction = await snap.createTransaction(parameter);

    return res.status(200).json({
      token: transaction.token,
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
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

    await order.update({ status });

    // Kirim notifikasi otomatis
    const Notification = require('../notification/notification.model');
    const statusMessages = {
      paid: { title: 'Pembayaran Dikonfirmasi', message: `Pembayaran pesanan ${order.order_code} telah dikonfirmasi admin.` },
      processing: { title: 'Pesanan Diproses', message: `Pesanan ${order.order_code} sedang diproses oleh tim kami.` },
      shipped: { title: 'Pesanan Dikirim!', message: `Pesanan ${order.order_code} telah dikirim. Segera sampai di tangan kamu!` },
      delivered: { title: 'Pesanan Selesai', message: `Pesanan ${order.order_code} telah diterima. Terima kasih telah berbelanja!` },
      cancelled: { title: 'Pesanan Dibatalkan', message: `Pesanan ${order.order_code} telah dibatalkan.` }
    };

    if (statusMessages[status]) {
      await Notification.create({
        user_id: order.user_id,
        title: statusMessages[status].title,
        message: statusMessages[status].message,
        type: 'order'
      });
    }

    return res.status(200).json({ message: 'Status order berhasil diupdate', order });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  checkout,
  getMyOrders,
  getOrder,
  uploadPaymentProof,
  getAllOrders,
  updateOrderStatus,
  createPayment
};