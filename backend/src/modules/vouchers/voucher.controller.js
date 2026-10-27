const Voucher = require('./voucher.model');
const { Op } = require('sequelize');

const checkVoucher = async (req, res) => {
  try {
    const { code, total_price } = req.body;

    if (!code) return res.status(400).json({ message: 'Kode voucher wajib diisi' });

    const totalPrice = parseInt(total_price) || 0;

    const voucher = await Voucher.findOne({
      where: {
        code: code.toUpperCase().trim(),
        is_active: true,
        [Op.or]: [
          { expired_at: null },
          { expired_at: { [Op.gt]: new Date() } }
        ]
      }
    });

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher tidak ditemukan atau sudah tidak aktif' });
    }

    if (voucher.used_count >= voucher.quota) {
      return res.status(400).json({ message: 'Kuota voucher sudah habis' });
    }

    if (totalPrice < voucher.min_purchase) {
      return res.status(400).json({
        message: `Minimum pembelian ${new Intl.NumberFormat('id-ID', {
          style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(voucher.min_purchase)} untuk menggunakan voucher ini`
      });
    }

    let discount = 0;
    if (voucher.type === 'percentage') {
      discount = Math.floor(totalPrice * (voucher.value / 100));
      if (voucher.max_discount && discount > voucher.max_discount) {
        discount = voucher.max_discount;
      }
    } else {
      discount = voucher.value;
      if (discount > totalPrice) discount = totalPrice; // jangan sampai minus
    }

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
    const voucher = await Voucher.create({
      ...req.body,
      code: req.body.code.toUpperCase().trim()
    });
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

module.exports = { checkVoucher, getActiveVouchers, createVoucher, getVouchers, updateVoucher, deleteVoucher };