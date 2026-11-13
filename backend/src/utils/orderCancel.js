const sequelize = require('../config/database');
const Order = require('../modules/orders/order.model');
const OrderItem = require('../modules/orders/order_item.model');
const { restoreStockMl } = require('./stockMl');
const { restoreVoucherUsage } = require('./voucherUsage');

// Pembatalan order yang atomik. Dipakai oleh pelanggan, webhook Midtrans, dan admin.
//
// Dalam SATU transaksi: kunci baris order (FOR UPDATE), periksa status di dalam
// kunci itu, ubah status -> cancelled, kembalikan stok vial, kembalikan kuota voucher.
// Jika salah satu langkah gagal, semuanya di-rollback. Karena status diperiksa
// setelah baris terkunci, dua pembatalan bersamaan (mis. pelanggan + webhook expire)
// tidak bisa sama-sama memulihkan stok: yang kedua melihat 'cancelled' dan ditolak.
//
// `canCancel(order)` mengembalikan null bila boleh, atau string alasan penolakan.
// Hasil: { notFound: true } | { rejected: 'alasan', order } | { order, previousStatus } (order.items terisi).
// Email dan notifikasi HARUS dikirim pemanggil setelah fungsi ini selesai (setelah commit).
const cancelOrderAtomic = async (where, canCancel) => {
  return sequelize.transaction(async (t) => {
    // Kunci tanpa include: FOR UPDATE tidak bisa dipakai pada sisi LEFT JOIN
    const order = await Order.findOne({ where, transaction: t, lock: t.LOCK.UPDATE });
    if (!order) return { notFound: true };

    const reason = canCancel(order);
    if (reason) return { rejected: reason, order };

    const items = await OrderItem.findAll({ where: { order_id: order.order_id }, transaction: t });

    const previousStatus = order.status;
    await order.update({ status: 'cancelled' }, { transaction: t });
    await restoreStockMl(items, { transaction: t });
    await restoreVoucherUsage(order, { transaction: t });

    // Supaya pemanggil (email/respons) tetap bisa membaca order.items seperti sebelumnya
    order.items = items;
    order.dataValues.items = items;
    return { order, previousStatus };
  });
};

module.exports = { cancelOrderAtomic };
