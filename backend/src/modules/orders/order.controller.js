const Order = require('./order.model');
const OrderItem = require('./order_item.model');
const Cart = require('../cart/cart.model');
const CartItem = require('../cart/cart_item.model');
const Product = require('../products/product.model');
const { snap } = require('../../config/midtrans');
const { sendOrderEmail } = require('../../utils/emailHelper');
const { adjustMl, mlNeeded } = require('../../utils/stockMl');
const { cancelOrderAtomic } = require('../../utils/orderCancel');
const { audit } = require('../../utils/audit');
const { calculateShipping, cartWeight, ShippingError, VALID_SIZES } = require('../../utils/shipping');
const { evaluateVoucher } = require('../../utils/voucherRules');
const sequelize = require('../../config/database');
const crypto = require('crypto');

const STATUS_FLOW = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
const ALL_STATUS = [...STATUS_FLOW, 'cancelled'];

// Generate order code
const generateOrderCode = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomInt(0, 100000000).toString().padStart(8, '0');
  return `TM-${dateStr}-${random}`;
};

// Error yang membatalkan transaksi checkout dan dikirim apa adanya ke klien
class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Checkout: seluruh langkah (cek stok, voucher, buat order, kurangi stok) berjalan
// dalam satu transaksi. Baris produk dan voucher dikunci (FOR UPDATE) supaya dua
// checkout bersamaan tidak bisa lolos pemeriksaan stok/kuota yang sama.
const checkout = async (req, res) => {
  try {
    const {
      shipping_name, shipping_phone, shipping_address, shipping_city, shipping_notes,
      delivery_method = 'delivery',
      courier, courier_service,
      voucher_code, address_id, pickup_store_id
    } = req.body;

    if (!['delivery', 'pickup'].includes(delivery_method)) {
      return res.status(400).json({ message: 'Metode pengiriman tidak valid' });
    }

    if (delivery_method === 'delivery' && !address_id) {
      if (!shipping_name || !shipping_phone || !shipping_address || !shipping_city) {
        return res.status(400).json({ message: 'Data pengiriman wajib diisi' });
      }
    }

    // ONGKIR dihitung server, di LUAR transaksi (memanggil RajaOngkir bisa lambat dan tidak boleh
    // menahan kunci baris produk). shipping_cost dari klien diabaikan sepenuhnya. Pickup selalu 0.
    let shipping = { courier: null, service: null, cost: 0 };
    let shippingWeight = null;
    if (delivery_method === 'delivery') {
      const preCart = await Cart.findOne({
        where: { user_id: req.user.user_id },
        include: [{ model: CartItem, as: 'items' }]
      });
      if (preCart && preCart.items.length > 0) {
        shippingWeight = cartWeight(preCart.items);
        const Address = require('../addresses/address.model');
        const preAddress = address_id
          ? await Address.findOne({ where: { address_id, user_id: req.user.user_id } })
          : null;
        if (address_id && !preAddress) return res.status(400).json({ message: 'Alamat tidak ditemukan' });
        try {
          shipping = await calculateShipping({
            courier, courierService: courier_service, address: preAddress, weight: shippingWeight
          });
        } catch (e) {
          if (e instanceof ShippingError) return res.status(400).json({ message: e.message });
          throw e;
        }
      }
    }

    const order = await sequelize.transaction(async (t) => {
      const cart = await Cart.findOne({
        where: { user_id: req.user.user_id },
        include: [{ model: CartItem, as: 'items' }],
        transaction: t
      });

      if (!cart || cart.items.length === 0) {
        throw new CheckoutError('Keranjang kosong');
      }

      // Kunci baris produk yang ada di keranjang (urut id agar tidak deadlock)
      const productIds = [...new Set(cart.items.map(i => i.product_id))].sort((a, b) => a - b);
      const products = {};
      for (const id of productIds) {
        products[id] = await Product.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      }

      // Data keranjang harus masuk akal: ukuran valid dan jumlah bilangan bulat >= 1
      for (const item of cart.items) {
        if (!VALID_SIZES.includes(parseInt(item.size_ml)) || !Number.isInteger(item.quantity) || item.quantity < 1) {
          throw new CheckoutError('Isi keranjang tidak valid');
        }
        const p = products[item.product_id];
        if (!p || !p.is_active) {
          throw new CheckoutError(`${p ? p.product_name : 'Produk'} sudah tidak tersedia`);
        }
      }

      // Keranjang berubah sejak ongkir dihitung (berat beda): minta klien menghitung ulang
      if (delivery_method === 'delivery' && cartWeight(cart.items) !== shippingWeight) {
        throw new CheckoutError('Isi keranjang berubah, silakan pilih ulang layanan pengiriman', 409);
      }

      // Cek sisa ml botol besar cukup untuk semua ukuran x jumlah per produk
      const byProduct = {};
      for (const item of cart.items) {
        (byProduct[item.product_id] = byProduct[item.product_id] || []).push(item);
      }
      for (const [productId, items] of Object.entries(byProduct)) {
        const p = products[productId];
        const have = Number(p.stock_ml) || 0;
        if (mlNeeded(items) > have) {
          throw new CheckoutError(`Stok ${p.product_name} tidak cukup (sisa ${have} ml)`);
        }
      }

      // Pickup: tentukan store tujuan (dicek sebelum voucher dipakai)
      let pickupStore = null;
      if (delivery_method === 'pickup') {
        const Store = require('../stores/store.model');
        pickupStore = pickup_store_id
          ? await Store.findOne({ where: { store_id: pickup_store_id, is_active: true }, transaction: t })
          : await Store.findOne({ where: { is_active: true }, order: [['store_id', 'ASC']], transaction: t });
        if (!pickupStore) {
          throw new CheckoutError(pickup_store_id
            ? 'Store pickup tidak ditemukan atau sedang tidak aktif'
            : 'Belum ada store aktif untuk pickup');
        }
      }

      // HARGA dihitung ulang dari produk (terkunci), bukan dari cart_items.price yang bisa basi
      const unitPrice = {};
      for (const item of cart.items) {
        const price = parseInt(products[item.product_id][`price_${parseInt(item.size_ml)}ml`]);
        if (!Number.isFinite(price) || price <= 0) {
          throw new CheckoutError(`Harga ${products[item.product_id].product_name} ${item.size_ml}ml tidak tersedia`);
        }
        unitPrice[item.cart_item_id] = price;
      }
      const subtotal = cart.items.reduce((sum, item) => sum + unitPrice[item.cart_item_id] * item.quantity, 0);

      let discount_amount = 0;
      let appliedVoucherCode = null;
      if (voucher_code) {
        // Aturan sama dengan POST /vouchers/check. Voucher yang dikirim tapi tidak
        // valid membatalkan checkout (tidak lagi diabaikan diam-diam).
        const result = await evaluateVoucher(voucher_code, subtotal, { transaction: t, lock: t.LOCK.UPDATE });
        if (result.error) throw new CheckoutError(result.error.message, 400);
        discount_amount = result.discount;
        await result.voucher.increment('used_count', { transaction: t });
        appliedVoucherCode = result.voucher.code;
      }

      const total_price = subtotal + shipping.cost - discount_amount;
      if (!(total_price >= 0)) throw new CheckoutError('Total pembayaran tidak valid');

      let shippingData = {
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_notes: shipping_notes || ''
      };

      if (address_id) {
        const Address = require('../addresses/address.model');
        const addr = await Address.findOne({ where: { address_id, user_id: req.user.user_id }, transaction: t });
        if (!addr) throw new CheckoutError('Alamat tidak ditemukan');
        shippingData = {
          shipping_name: addr.recipient_name,
          shipping_phone: addr.phone,
          shipping_address: addr.detail,
          shipping_city: addr.city,
          shipping_notes: shipping_notes || ''
        };
      }

      if (delivery_method === 'pickup') {
        const User = require('../auth/user.model');
        const user = await User.findByPk(req.user.user_id, { transaction: t });
        shippingData = {
          shipping_name: user.full_name,
          shipping_phone: user.phone || '-',
          shipping_address: `Pickup di ${pickupStore.name} — ${pickupStore.address}`,
          shipping_city: pickupStore.city,
          shipping_notes: ''
        };
      }

      const created = await Order.create({
        user_id: req.user.user_id,
        order_code: generateOrderCode(),
        total_price,
        ...shippingData,
        delivery_method,
        pickup_store_id: pickupStore ? pickupStore.store_id : null,
        courier: delivery_method === 'delivery' ? shipping.courier : null,
        courier_service: delivery_method === 'delivery' ? shipping.service : null,
        shipping_cost: delivery_method === 'delivery' ? shipping.cost : 0,
        // Hanya disimpan kalau benar-benar terpakai (dipakai untuk mengembalikan kuota saat batal)
        voucher_code: appliedVoucherCode,
        discount_amount
      }, { transaction: t });

      for (const item of cart.items) {
        const product = products[item.product_id];
        await OrderItem.create({
          order_id: created.order_id,
          product_id: item.product_id,
          product_name: product.product_name,
          brand: product.brand,
          size_ml: item.size_ml,
          quantity: item.quantity,
          price: unitPrice[item.cart_item_id]
        }, { transaction: t });

        // Kurangi sisa ml botol besar sebesar ukuran x jumlah
        await adjustMl(product, item.size_ml, -item.quantity, item.quantity, { transaction: t });
      }

      await CartItem.destroy({ where: { cart_id: cart.cart_id }, transaction: t });

      return created;
    });

    return res.status(201).json({ message: 'Order berhasil dibuat', order });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get my orders
const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const where = { user_id: req.user.user_id };
    if (req.query.status) {
      if (!ALL_STATUS.includes(req.query.status)) {
        return res.status(400).json({ message: 'Status tidak valid' });
      }
      where.status = req.query.status;
    }

    // distinct: true supaya count tidak menghitung baris item (include hasMany)
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true
    });

    // Jumlah pesanan per status (seluruh riwayat) untuk badge tab filter di frontend
    const grouped = await Order.count({
      where: { user_id: req.user.user_id },
      group: ['status']
    });
    const counts = {};
    grouped.forEach(g => { counts[g.status] = parseInt(g.count); });

    return res.status(200).json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      counts,
      orders: rows
    });
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
    // Status, stok, dan voucher berubah dalam satu transaksi (utils/orderCancel.js)
    const result = await cancelOrderAtomic(
      { order_id: req.params.id, user_id: req.user.user_id },
      (o) => o.status !== 'pending'
        ? 'Hanya pesanan dengan status menunggu pembayaran yang dapat dibatalkan'
        : null
    );
    if (result.notFound) return res.status(404).json({ message: 'Order tidak ditemukan' });
    if (result.rejected) return res.status(400).json({ message: result.rejected });
    const order = result.order;
    await audit(req, { action: 'cancel', entity: 'order', entityId: order.order_id,
      message: `Pesanan ${order.order_code} dibatalkan pelanggan`,
      before: { status: 'pending' }, after: { status: 'cancelled' } });

    // Notifikasi in-app
    try {
      const Notification = require('../notification/notification.model');
      const notif = await Notification.create({
        user_id: order.user_id,
        title: 'Pesanan Dibatalkan',
        message: `Pesanan ${order.order_code} berhasil dibatalkan.`,
        type: 'order',
        link: `/orders/${order.order_id}`
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${order.user_id}`).emit('notification', {
          notification_id: notif.notification_id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          link: notif.link,
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
      // Midtrans mewajibkan jumlah item_details == gross_amount,
      // jadi ongkir ditambah sebagai item dan diskon voucher sebagai item bernilai negatif
      item_details: [
        ...order.items.map(item => ({
          id: String(item.product_id),
          price: item.price,
          quantity: item.quantity,
          name: `${item.product_name} (${item.size_ml}ml)`
        })),
        ...(order.shipping_cost > 0
          ? [{ id: 'SHIPPING', price: order.shipping_cost, quantity: 1, name: 'Ongkos Kirim' }]
          : []),
        ...(order.discount_amount > 0
          ? [{ id: 'DISCOUNT', price: -order.discount_amount, quantity: 1, name: `Diskon Voucher ${order.voucher_code || ''}`.trim() }]
          : [])
      ],
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
      offset,
      distinct: true // hitung pesanan, bukan baris hasil join dengan item
    });

    // Sertakan nama cabang untuk pesanan pickup (orders.pickup_store_id belum punya association)
    const storeIds = [...new Set(rows.map(o => o.pickup_store_id).filter(Boolean))];
    let storeMap = {};
    if (storeIds.length) {
      const Store = require('../stores/store.model');
      const stores = await Store.findAll({ where: { store_id: storeIds }, attributes: ['store_id', 'name', 'city'] });
      storeMap = Object.fromEntries(stores.map(st => [st.store_id, st.toJSON()]));
    }
    const orders = rows.map(o => ({ ...o.toJSON(), pickup_store: storeMap[o.pickup_store_id] || null }));

    return res.status(200).json({ total: count, orders });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Urutan status normal. Admin hanya boleh maju ke status berikutnya atau membatalkan.
const isValidTransition = (from, to) => {
  if (from === to) return false;
  // delivered dan cancelled sudah final (cancelled tidak boleh diaktifkan lagi
  // karena stok sudah dikembalikan)
  if (from === 'delivered' || from === 'cancelled') return false;
  if (to === 'cancelled') return true;
  return STATUS_FLOW.indexOf(to) > STATUS_FLOW.indexOf(from);
};

// Admin: update status order
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALL_STATUS.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    let order;
    let previousStatus;
    if (status === 'cancelled') {
      // Pembatalan oleh admin: atomik (status + stok + voucher), dicek di dalam kunci baris
      const result = await cancelOrderAtomic(
        { order_id: req.params.id },
        (o) => isValidTransition(o.status, 'cancelled')
          ? null
          : `Status tidak bisa diubah dari "${o.status}" ke "cancelled"`
      );
      if (result.notFound) return res.status(404).json({ message: 'Order tidak ditemukan' });
      if (result.rejected) return res.status(400).json({ message: result.rejected });
      order = result.order;
      previousStatus = result.previousStatus;
    } else {
      // Transisi biasa: kunci baris order, validasi transisi DI DALAM kunci, baru update.
      // Tanpa ini, pembatalan dari webhook di antara baca dan update bisa tertimpa
      // (status kembali "paid" padahal stok sudah dikembalikan).
      const result = await sequelize.transaction(async (t) => {
        const locked = await Order.findOne({
          where: { order_id: req.params.id }, transaction: t, lock: t.LOCK.UPDATE
        });
        if (!locked) return { notFound: true };
        if (!isValidTransition(locked.status, status)) {
          return { rejected: `Status tidak bisa diubah dari "${locked.status}" ke "${status}"` };
        }
        const prev = locked.status;
        await locked.update({ status }, { transaction: t });
        return { prev };
      });
      if (result.notFound) return res.status(404).json({ message: 'Order tidak ditemukan' });
      if (result.rejected) return res.status(400).json({ message: result.rejected });
      previousStatus = result.prev;

      // Baca ulang SETELAH commit; audit, notifikasi, dan email di bawah juga setelah commit
      order = await Order.findByPk(req.params.id, {
        include: [{ model: OrderItem, as: 'items' }]
      });
    }

    await audit(req, { action: 'update_status', entity: 'order', entityId: order.order_id,
      message: `Status pesanan ${order.order_code}: ${previousStatus} → ${status}`,
      before: { status: previousStatus }, after: { status } });

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
          type: 'order',
          link: `/orders/${order.order_id}`
        });

        const io = req.app.get('io');
        if (io) {
          io.to(`user_${order.user_id}`).emit('notification', {
            notification_id: notif.notification_id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            link: notif.link,
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
  checkout, getMyOrders, getOrder,
  getAllOrders, updateOrderStatus, createPayment, cancelOrder
};