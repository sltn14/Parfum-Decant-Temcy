// Data demo untuk tangkapan layar/video dokumen. Lihat scripts/README_seed_demo.md.
//   ALLOW_DEMO_SEED=true DEMO_PASSWORD=... node scripts/seed_demo.js
// Aman dijalankan berulang (idempoten). TIDAK berjalan di database yang namanya tidak memuat "demo"/"test".
require('dotenv').config();

const guard = () => {
  const dbName = String(process.env.DB_NAME || '');
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    console.error('Dibatalkan: set ALLOW_DEMO_SEED=true untuk menjalankan seed demo.');
    process.exit(1);
  }
  if (!/demo|test/i.test(dbName)) {
    console.error(`Dibatalkan: nama database "${dbName}" tidak mengandung "demo" atau "test". Seed demo tidak boleh dijalankan ke database utama.`);
    process.exit(1);
  }
  const pwd = process.env.DEMO_PASSWORD;
  if (!pwd || pwd.length < 8) {
    console.error('Dibatalkan: DEMO_PASSWORD wajib diisi di environment (minimal 8 karakter).');
    process.exit(1);
  }
};
guard();

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const sequelize = require('../src/config/database');
const User = require('../src/modules/auth/user.model');
const Product = require('../src/modules/products/product.model');
const Store = require('../src/modules/stores/store.model');
const Voucher = require('../src/modules/vouchers/voucher.model');
const Order = require('../src/modules/orders/order.model');
const OrderItem = require('../src/modules/orders/order_item.model');
const OrderTracking = require('../src/modules/tracking/tracking.model');
const Notification = require('../src/modules/notification/notification.model');
const Favorite = require('../src/modules/favorites/favorite.model');
const Review = require('../src/modules/reviews/review.model');
const { mlFields } = require('../src/utils/stockMl');

const SIZES = [1, 2, 3, 5];
const INITIAL_VIAL = 20; // stok awal per ukuran per produk demo
const DOMAIN = 'demo.decanttemcy.test';
const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

const USERS = [
  { key: 'sysadmin', full_name: 'Demo Sysadmin', email: `sysadmin@${DOMAIN}`, role: 'sysadmin' },
  { key: 'admin', full_name: 'Demo Admin', email: `admin@${DOMAIN}`, role: 'admin' },
  { key: 'c1', full_name: 'Demo Customer Satu', email: `customer1@${DOMAIN}`, role: 'customer', phone: '081200000001' },
  { key: 'c2', full_name: 'Demo Customer Dua', email: `customer2@${DOMAIN}`, role: 'customer', phone: '081200000002' },
  { key: 'c3', full_name: 'Demo Customer Tiga', email: `customer3@${DOMAIN}`, role: 'customer', phone: '081200000003' }
];

const PRODUCTS = [
  { brand: 'Demo Atelier', product_name: 'Aurum Woods', concentration: 'EDP', gender: 'Male', main_accords: 'Woody, Amber', p: [12000, 22000, 31000, 50000] },
  { brand: 'Demo Atelier', product_name: 'Citrus Bloom', concentration: 'EDT', gender: 'Unisex', main_accords: 'Citrus, Floral', p: [9000, 16000, 23000, 38000] },
  { brand: 'Demo Atelier', product_name: 'Velvet Rose', concentration: 'EDP', gender: 'Female', main_accords: 'Floral, Vanilla', p: [14000, 26000, 37000, 60000] },
  { brand: 'Demo Atelier', product_name: 'Ocean Drift', concentration: 'EDT', gender: 'Male', main_accords: 'Aquatic, Fresh', p: [10000, 18000, 26000, 42000] }
];

const STORES = [
  { name: 'Demo Store Semarang', city: 'Semarang', address: 'Jl. Pemuda No. 1, Semarang', phone: '0241000001' },
  { name: 'Demo Store Jakarta', city: 'Jakarta Selatan', address: 'Jl. Fatmawati No. 2, Jakarta', phone: '021000002' }
];

const VOUCHERS = [
  { code: 'DEMO10', type: 'percentage', value: 10, max_discount: 20000, min_purchase: 20000, quota: 50, is_active: true, expired_at: daysFromNow(90) },
  { code: 'DEMOEXPIRED', type: 'fixed', value: 5000, max_discount: null, min_purchase: 0, quota: 10, is_active: true, expired_at: daysFromNow(-1) },
  { code: 'DEMOHABIS', type: 'fixed', value: 5000, max_discount: null, min_purchase: 0, quota: 1, is_active: true, expired_at: daysFromNow(90) }
];

// Satu pesanan untuk tiap status. items: [indeks produk, ukuran ml, jumlah]
const ORDERS = [
  { status: 'pending', user: 'c1', delivery: 'pickup', items: [[0, 5, 2]] },
  { status: 'paid', user: 'c2', delivery: 'pickup', items: [[1, 3, 1], [0, 2, 1]], voucher: 'DEMO10' },
  { status: 'processing', user: 'c3', delivery: 'delivery', courier: 'jne', service: 'REG', cost: 18000, items: [[2, 5, 1]] },
  { status: 'shipped', user: 'c1', delivery: 'delivery', courier: 'jne', service: 'REG', cost: 18000, items: [[1, 5, 1]], resi: 'DEMOJNE0001' },
  { status: 'delivered', user: 'c2', delivery: 'delivery', courier: 'sicepat', service: 'REG', cost: 15000, items: [[3, 2, 3]], resi: 'DEMOSCP0001', review: [3, 5, 'Segar dan awet, cocok untuk harian.'] },
  { status: 'delivered', user: 'c3', delivery: 'pickup', items: [[0, 1, 2]], voucher: 'DEMOHABIS', review: [0, 4, 'Wangi kayunya elegan.'], suffix: '2' },
  { status: 'cancelled', user: 'c3', delivery: 'pickup', items: [[1, 5, 1]] }
];

const discountFor = (v, subtotal) => {
  if (!v || subtotal < (v.min_purchase || 0)) return 0;
  const raw = v.type === 'percentage' ? Math.floor((subtotal * v.value) / 100) : v.value;
  return Math.min(raw, v.max_discount || raw, subtotal);
};

const run = async () => {
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  const opt = { transaction: t };
  const created = { users: 0, products: 0, vouchers: 0, stores: 0, orders: 0 };

  try {
    // Pengguna: kata sandi hanya dari DEMO_PASSWORD, tidak pernah dicetak
    const hash = await bcrypt.hash(process.env.DEMO_PASSWORD, 10);
    const users = {};
    for (const u of USERS) {
      const [row, isNew] = await User.findOrCreate({
        where: { email: u.email },
        defaults: { full_name: u.full_name, password: hash, role: u.role, phone: u.phone || null, is_verified: true, is_active: true },
        transaction: t
      });
      if (isNew) created.users++;
      users[u.key] = row;
    }

    // Produk demo (stok dihitung ulang di akhir)
    const products = [];
    for (const p of PRODUCTS) {
      const vials = { stock_1ml: INITIAL_VIAL, stock_2ml: INITIAL_VIAL, stock_3ml: INITIAL_VIAL, stock_5ml: INITIAL_VIAL };
      const [row, isNew] = await Product.findOrCreate({
        where: { brand: p.brand, product_name: p.product_name },
        defaults: {
          concentration: p.concentration, gender: p.gender, main_accords: p.main_accords, is_active: true,
          price_1ml: p.p[0], price_2ml: p.p[1], price_3ml: p.p[2], price_5ml: p.p[3],
          ...vials, ...mlFields(vials, 0)
        },
        transaction: t
      });
      if (isNew) created.products++;
      products.push(row);
    }

    const stores = [];
    for (const s of STORES) {
      const [row, isNew] = await Store.findOrCreate({ where: { name: s.name }, defaults: { ...s, is_active: true }, transaction: t });
      if (isNew) created.stores++;
      stores.push(row);
    }

    const vouchers = {};
    for (const v of VOUCHERS) {
      const [row, isNew] = await Voucher.findOrCreate({ where: { code: v.code }, defaults: { ...v, used_count: 0 }, transaction: t });
      if (isNew) created.vouchers++;
      vouchers[v.code] = row;
    }

    // Pesanan: kode tetap DEMO-<STATUS>, jadi pesanan yang sudah ada dilewati
    for (const o of ORDERS) {
      const code = `DEMO-${o.status.toUpperCase()}${o.suffix || ''}`;
      if (await Order.findOne({ where: { order_code: code }, transaction: t })) continue;

      const lines = o.items.map(([pi, size, qty]) => {
        const p = products[pi];
        return { p, size, qty, price: p[`price_${size}ml`] };
      });
      const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
      const voucher = o.voucher ? vouchers[o.voucher] : null;
      const discount = discountFor(voucher, subtotal);
      const shipping = o.delivery === 'delivery' ? o.cost : 0;
      const buyer = users[o.user];
      const paidStatuses = ['paid', 'processing', 'shipped', 'delivered'];

      const order = await Order.create({
        user_id: buyer.user_id, order_code: code, status: o.status,
        total_price: subtotal - discount + shipping,
        shipping_name: buyer.full_name, shipping_phone: buyer.phone,
        shipping_address: o.delivery === 'delivery' ? 'Jl. Contoh Demo No. 10, Semarang' : null,
        shipping_city: o.delivery === 'delivery' ? 'Semarang' : null,
        payment_method: 'QRIS', delivery_method: o.delivery,
        pickup_store_id: o.delivery === 'pickup' ? stores[0].store_id : null,
        courier: o.courier || null, courier_service: o.service || null, shipping_cost: shipping,
        tracking_number: o.resi || null,
        voucher_code: voucher ? voucher.code : null, discount_amount: discount,
        paid_at: paidStatuses.includes(o.status) ? daysFromNow(-3) : null
      }, opt);

      for (const l of lines) {
        await OrderItem.create({
          order_id: order.order_id, product_id: l.p.product_id, product_name: l.p.product_name,
          brand: l.p.brand, size_ml: l.size, quantity: l.qty, price: l.price
        }, opt);
      }

      if (o.resi) {
        await OrderTracking.create({
          order_id: order.order_id, courier: o.courier.toUpperCase(), tracking_number: o.resi,
          status: o.status === 'delivered' ? 'Paket diterima' : 'Dalam pengiriman',
          description: o.status === 'delivered' ? 'Paket telah diterima pelanggan' : 'Paket dalam perjalanan', location: 'Semarang'
        }, opt);
      }

      await Notification.create({
        user_id: buyer.user_id, type: 'order', is_read: o.status === 'delivered',
        title: `Pesanan ${code}`, message: `Status pesanan ${code}: ${o.status}.`
      }, opt);

      if (o.review) {
        const [pi, rating, comment] = o.review;
        await Review.findOrCreate({
          where: { user_id: buyer.user_id, product_id: products[pi].product_id },
          defaults: { rating, comment, is_active: true }, transaction: t
        });
        await Favorite.findOrCreate({ where: { user_id: buyer.user_id, product_id: products[pi].product_id }, transaction: t });
      }
      created.orders++;
    }

    // Promo + favorit tambahan
    await Notification.findOrCreate({
      where: { user_id: users.c1.user_id, title: 'Promo Demo' },
      defaults: { type: 'promo', message: 'Gunakan kode DEMO10 untuk diskon 10%.', is_read: false }, transaction: t
    });
    await Favorite.findOrCreate({ where: { user_id: users.c1.user_id, product_id: products[2].product_id }, transaction: t });

    // Konsistensi: stok vial, sold_count, dan used_count voucher dihitung ulang dari SEMUA pesanan demo
    const demoOrders = await Order.findAll({
      where: { order_code: { [Op.like]: 'DEMO-%' }, status: { [Op.ne]: 'cancelled' } },
      include: [{ model: OrderItem, as: 'items' }], transaction: t
    });
    for (const p of products) {
      const vials = { stock_1ml: INITIAL_VIAL, stock_2ml: INITIAL_VIAL, stock_3ml: INITIAL_VIAL, stock_5ml: INITIAL_VIAL };
      let sold = 0;
      for (const ord of demoOrders) for (const it of ord.items) {
        if (it.product_id !== p.product_id) continue;
        vials[`stock_${it.size_ml}ml`] -= it.quantity;
        sold += it.quantity;
      }
      const initialMl = SIZES.reduce((s, z) => s + z * INITIAL_VIAL, 0);
      await p.update({ ...vials, sold_count: sold, ...mlFields(vials, initialMl) }, opt);
    }
    for (const v of Object.values(vouchers)) {
      await v.update({ used_count: demoOrders.filter(o => o.voucher_code === v.code).length }, opt);
    }

    await t.commit();

    console.log('Seed demo selesai. Baru dibuat:', JSON.stringify(created));
    console.log('Akun demo (sandi = nilai DEMO_PASSWORD):');
    for (const u of USERS) console.log(`  ${u.role.padEnd(9)} ${u.email}`);
    console.log('Voucher: DEMO10 (aktif), DEMOEXPIRED (kedaluwarsa), DEMOHABIS (kuota habis)');
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

run()
  .catch((err) => { console.error('Seed demo gagal:', err.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
