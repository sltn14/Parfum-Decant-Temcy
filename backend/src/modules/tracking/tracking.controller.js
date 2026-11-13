const OrderTracking = require('./tracking.model');
const Order = require('../orders/order.model');
const { audit, pickKeys } = require('../../utils/audit');

// Panjang maksimum mengikuti kolom order_tracking
const LIMITS = { courier: 50, tracking_number: 100, status: 100, location: 200, description: 1000 };
const TRACKING_KEYS = ['courier', 'tracking_number', 'status', 'description', 'location'];

// undefined/null/'' -> { value: undefined } (tidak diubah); bukan string atau terlalu panjang -> { error }
const optionalText = (v, field, label) => {
  if (v === undefined || v === null) return { value: undefined };
  if (typeof v !== 'string') return { error: `${label} harus berupa teks` };
  const t = v.trim();
  if (t.length > LIMITS[field]) return { error: `${label} maksimal ${LIMITS[field]} karakter` };
  return { value: t === '' ? undefined : t };
};

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
    const orderId = Number(req.body.order_id);
    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({ message: 'order_id wajib diisi' });
    }

    // Kurir dan nomor resi wajib string tidak kosong (tidak boleh menimpa data lama dengan kosong)
    const required = {};
    for (const [field, label] of [['courier', 'Kurir'], ['tracking_number', 'Nomor resi']]) {
      const v = req.body[field];
      if (typeof v !== 'string' || v.trim() === '') {
        return res.status(400).json({ message: `${label} wajib diisi` });
      }
      if (v.trim().length > LIMITS[field]) {
        return res.status(400).json({ message: `${label} maksimal ${LIMITS[field]} karakter` });
      }
      required[field] = v.trim();
    }

    const fields = { ...required };
    for (const [field, label] of [['status', 'Status'], ['description', 'Deskripsi'], ['location', 'Lokasi']]) {
      const r = optionalText(req.body[field], field, label);
      if (r.error) return res.status(400).json({ message: r.error });
      if (r.value !== undefined) fields[field] = r.value;
    }

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

    // Pesanan pickup diambil sendiri di toko: tidak ada kurir dan nomor resi
    if (order.delivery_method === 'pickup') {
      return res.status(400).json({ message: 'Pesanan pickup diambil di toko, tidak memakai kurir dan nomor resi' });
    }

    let tracking = await OrderTracking.findOne({ where: { order_id: orderId } });
    const before = tracking ? pickKeys(tracking, TRACKING_KEYS) : null;
    if (tracking) {
      await tracking.update(fields);
    } else {
      tracking = await OrderTracking.create({ order_id: orderId, status: 'Dalam pengiriman', ...fields });
    }

    // Update nomor resi di order
    await order.update({ tracking_number: fields.tracking_number });

    await audit(req, {
      action: 'update_tracking', entity: 'order_tracking', entityId: orderId,
      message: `Tracking pesanan ${order.order_code} diupdate (${fields.courier} ${fields.tracking_number})`,
      before, after: pickKeys(tracking, TRACKING_KEYS)
    });

    return res.status(200).json({ message: 'Tracking diupdate', tracking });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTracking, updateTracking };