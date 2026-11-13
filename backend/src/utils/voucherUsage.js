const Voucher = require('../modules/vouchers/voucher.model');

// Kembalikan 1 pemakaian voucher saat order dibatalkan.
// Voucher dianggap terpakai hanya jika order punya voucher_code dan diskon > 0
// (lihat checkout). Panggil bersamaan dengan restoreStockMl, sekali per order.
const restoreVoucherUsage = async (order, options = {}) => {
  if (!order || !order.voucher_code || !(order.discount_amount > 0)) return;
  const voucher = await Voucher.findOne({
    where: { code: String(order.voucher_code).toUpperCase() },
    ...options,
    ...(options.transaction && { lock: options.transaction.LOCK.UPDATE })
  });
  if (voucher && voucher.used_count > 0) await voucher.decrement('used_count', options.transaction ? { transaction: options.transaction } : undefined);
};

module.exports = { restoreVoucherUsage };
