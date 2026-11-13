// Kembalikan semua pesanan pool (order_code LT-%) ke "pending" antar ulangan uji.
// Hapus juga riwayat tracking/notifikasi yang terbentuk dari perubahan status uji.
//   ALLOW_LOADTEST_DATA=true node scripts/reset_order_pool.js          -> reset ke pending
//   ALLOW_LOADTEST_DATA=true node scripts/reset_order_pool.js --delete -> hapus pool
const { guard } = require('./_loadtestGuard');
guard();

const { Op } = require('sequelize');
const sequelize = require('../src/config/database');
const Order = require('../src/modules/orders/order.model');
const OrderItem = require('../src/modules/orders/order_item.model');
const OrderTracking = require('../src/modules/tracking/tracking.model');
const Notification = require('../src/modules/notification/notification.model');

(async () => {
  const del = process.argv.includes('--delete');
  try {
    await sequelize.authenticate();
    const orders = await Order.findAll({ where: { order_code: { [Op.like]: 'LT-%' } }, attributes: ['order_id'] });
    const ids = orders.map(o => o.order_id);
    if (!ids.length) { console.log('Tidak ada pesanan pool (LT-%).'); return; }
    await sequelize.transaction(async (t) => {
      await OrderTracking.destroy({ where: { order_id: ids }, transaction: t });
      await Notification.destroy({ where: { link: ids.map(id => `/orders/${id}`) }, transaction: t });
      if (del) {
        await OrderItem.destroy({ where: { order_id: ids }, transaction: t });
        await Order.destroy({ where: { order_id: ids }, transaction: t });
      } else {
        await Order.update({ status: 'pending', paid_at: null, tracking_number: null }, { where: { order_id: ids }, transaction: t });
      }
    });
    console.log(`${del ? 'Dihapus' : 'Direset ke pending'}: ${ids.length} pesanan pool.`);
  } catch (e) {
    console.error('Gagal:', e.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
