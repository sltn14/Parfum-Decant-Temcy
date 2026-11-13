const Voucher = require('./voucher.model');
const { Op } = require('sequelize');
const { evaluateVoucher } = require('../../utils/voucherRules');
const { audit, pickKeys, changes } = require('../../utils/audit');

// used_count dan voucher_id tidak boleh diubah dari klien
const VOUCHER_FIELDS = ['code', 'type', 'value', 'min_purchase', 'max_discount', 'quota', 'is_active', 'expired_at'];
const pickVoucher = (body = {}) => {
  const out = {};
  for (const k of VOUCHER_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  if (typeof out.code === 'string') out.code = out.code.toUpperCase().trim();
  return out;
};

const checkVoucher = async (req, res) => {
  try {
    const { code, total_price } = req.body;

    if (!code) return res.status(400).json({ message: 'Kode voucher wajib diisi' });

    const result = await evaluateVoucher(code, total_price);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });
    const { voucher, discount } = result;

    return res.status(200).json({
      valid: true,
      voucher: {
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        discount,
        min_purchase: voucher.min_purchase,
        max_discount: voucher.max_discount
      }
    });
  } catch (err) {
    console.error('checkVoucher error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Endpoint baru — ambil semua voucher aktif untuk ditampilkan ke customer
const getActiveVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { expired_at: null },
          { expired_at: { [Op.gt]: new Date() } }
        ],
        // Masih ada kuota
        used_count: { [Op.lt]: Voucher.sequelize.col('quota') }
      },
      attributes: ['voucher_id', 'code', 'type', 'value', 'min_purchase', 'max_discount', 'expired_at', 'quota', 'used_count'],
      order: [['value', 'DESC']]
    });

    return res.status(200).json({ vouchers });
  } catch (err) {
    console.error('getActiveVouchers error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const createVoucher = async (req, res) => {
  try {
    const data = pickVoucher(req.body);
    if (!data.code) return res.status(400).json({ message: 'Kode voucher wajib diisi' });
    const voucher = await Voucher.create(data);
    await audit(req, { action: 'create', entity: 'voucher', entityId: voucher.voucher_id,
      message: `Voucher dibuat: ${voucher.code}`, after: pickKeys(voucher, VOUCHER_FIELDS) });
    return res.status(201).json({ message: 'Voucher berhasil dibuat', voucher });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Kode voucher sudah digunakan' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

const getVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({ order: [['createdAt', 'DESC']] });
    return res.status(200).json({ vouchers });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Voucher tidak ditemukan' });
    const beforeSnap = pickKeys(voucher, VOUCHER_FIELDS);
    await voucher.update(pickVoucher(req.body));
    await audit(req, { action: 'update', entity: 'voucher', entityId: voucher.voucher_id,
      message: `Voucher diubah: ${voucher.code}`, ...changes(beforeSnap, pickKeys(voucher, VOUCHER_FIELDS)) });
    return res.status(200).json({ message: 'Voucher diupdate', voucher });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Voucher tidak ditemukan' });
    const beforeSnap = pickKeys(voucher, [...VOUCHER_FIELDS, 'used_count']);
    await voucher.destroy();
    await audit(req, { action: 'delete', entity: 'voucher', entityId: voucher.voucher_id,
      message: `Voucher dihapus: ${voucher.code}`, before: beforeSnap });
    return res.status(200).json({ message: 'Voucher dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkVoucher, getActiveVouchers, createVoucher, getVouchers, updateVoucher, deleteVoucher };