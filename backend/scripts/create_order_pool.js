// Buat pool M pesanan uji berstatus tertentu (default pending) untuk uji PUT /api/orders/:id/status.
// Pesanan ditandai order_code berawalan "LT-" agar mudah dibersihkan/direset.
//   ALLOW_LOADTEST_DATA=true [LOAD_ORDERS=500] [LOAD_ORDER_STATUS=pending|delivered] node scripts/create_order_pool.js
// Pakai status "delivered" untuk menyiapkan pesanan bagi responden yang akan mengulas produk (SUS).
const { guard, intEnv, EMAIL_DOMAIN } = require('./_loadtestGuard');
guard();

const { Op } = require('sequelize');
const sequelize = require('../src/config/database');
const User = require('../src/modules/auth/user.model');
const Product = require('../src/modules/products/product.model');
const Order = require('../src/modules/orders/order.model');
const OrderItem = require('../src/modules/orders/order_item.model');

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

(async () => {
  const m = intEnv('LOAD_ORDERS', 500);
  const status = process.env.LOAD_ORDER_STATUS || 'pending';
  if (!STATUSES.includes(status)) {
    console.error(`Dibatalkan: LOAD_ORDER_STATUS harus salah satu dari ${STATUSES.join(', ')}.`);
    process.exit(1);
  }
  try {
    await sequelize.authenticate();
    const users = await User.findAll({
      where: { email: { [Op.like]: `loaduser%@${EMAIL_DOMAIN}` } },
      attributes: ['user_id'], order: [['user_id', 'ASC']]
    });
    const products = await Product.findAll({ attributes: ['product_id', 'product_name', 'brand'], order: [['product_id', 'ASC']] });
    if (!users.length || !products.length) {
      console.error('Dibatalkan: butuh akun uji (create_test_users.js) dan minimal 1 produk.');
      process.exit(1);
    }
    const stamp = Date.now().toString(36);
    await sequelize.transaction(async (t) => {
      for (let i = 0; i < m; i++) {
        const u = users[i % users.length];
        const p = products[i % products.length];
        const order = await Order.create({
          user_id: u.user_id,
          order_code: `LT-${stamp}-${String(i + 1).padStart(5, '0')}`,
          status,
          total_price: 10000,
          shipping_name: 'Load Test', payment_method: 'QRIS',
          delivery_method: 'pickup',
          paid_at: status === 'pending' ? null : new Date()
        }, { transaction: t });
        await OrderItem.create({
          order_id: order.order_id, product_id: p.product_id,
          product_name: p.product_name, brand: p.brand, size_ml: 1, quantity: 1, price: 10000
        }, { transaction: t });
      }
    });
    console.log(`Selesai: ${m} pesanan "${status}" (kode LT-${stamp}-*) untuk ${users.length} akun uji.`);
  } catch (e) {
    console.error('Gagal:', e.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
