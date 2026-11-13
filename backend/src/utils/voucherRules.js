const { Op } = require('sequelize');
const Voucher = require('../modules/vouchers/voucher.model');

const rupiah = (n) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0
}).format(n);

// Satu-satunya tempat aturan voucher didefinisikan. Dipakai oleh
// POST /vouchers/check dan checkout supaya hasilnya selalu sama.
//
// Mengembalikan { voucher, discount } bila valid, atau { error: { status, message } }.
// `options` diteruskan ke query (mis. { transaction, lock } di checkout).
const evaluateVoucher = async (code, subtotal, options = {}) => {
  const normalized = String(code || '').toUpperCase().trim();
  if (!normalized) return { error: { status: 400, message: 'Kode voucher wajib diisi' } };

  const voucher = await Voucher.findOne({
    where: {
      code: normalized,
      is_active: true,
      [Op.or]: [{ expired_at: null }, { expired_at: { [Op.gt]: new Date() } }]
    },
    ...options
  });

  if (!voucher) {
    return { error: { status: 404, message: 'Voucher tidak ditemukan atau sudah tidak aktif' } };
  }
  if (voucher.used_count >= voucher.quota) {
    return { error: { status: 400, message: 'Kuota voucher sudah habis' } };
  }
  const total = parseInt(subtotal) || 0;
  if (total < voucher.min_purchase) {
    return {
      error: {
        status: 400,
        message: `Minimum pembelian ${rupiah(voucher.min_purchase)} untuk menggunakan voucher ini`
      }
    };
  }

  let discount;
  if (voucher.type === 'percentage') {
    discount = Math.floor(total * (voucher.value / 100));
    if (voucher.max_discount && discount > voucher.max_discount) discount = voucher.max_discount;
  } else {
    discount = voucher.value;
  }
  if (discount > total) discount = total; // jangan sampai minus

  return { voucher, discount };
};

module.exports = { evaluateVoucher };
