const Voucher = require('./voucher.model');
const { Op } = require('sequelize');

const checkVoucher = async (req, res) => {
  try {
    const { code, total_price } = req.body;
    const voucher = await Voucher.findOne({
      where: {
        code: code.toUpperCase(),
        is_active: true,
        [Op.or]: [
          { expired_at: null },
          { expired_at: { [Op.gt]: new Date() } }
        ]
      }
    });

    if (!voucher) return res.status(404).json({ message: 'Voucher tidak ditemukan atau sudah expired' });
    if (voucher.used_count >= voucher.quota) return res.status(400).json({ message: 'Kuota voucher habis' });
    if (total_price < voucher.min_purchase) {
      return res.status(400).json({
        message: `Minimum pembelian ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(voucher.min_purchase)}`
      });
    }

    let discount = 0;
    if (voucher.type === 'percentage') {
      discount = Math.floor(total_price * (voucher.value / 100));
      if (voucher.max_discount) discount = Math.min(discount, voucher.max_discount);
    } else {
      discount = voucher.value;
    }

    return res.status(200).json({
      valid: true,
      voucher: {
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        discount
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin
const createVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.create({ ...req.body, code: req.body.code.toUpperCase() });
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
    await voucher.update(req.body);
    return res.status(200).json({ message: 'Voucher diupdate', voucher });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Voucher tidak ditemukan' });
    await voucher.destroy();
    return res.status(200).json({ message: 'Voucher dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkVoucher, createVoucher, getVouchers, updateVoucher, deleteVoucher };