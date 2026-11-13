const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ready, reason } = require('./ready');

// describe yang otomatis menjadi skip (dengan alasan) bila database uji belum siap
const describeDb = (name, fn) => {
  if (ready) return describe(name, fn);
  return describe(name, () => {
    test.skip(`dilewati: ${reason}`, () => {});
  });
};

// Muat model setelah env.js mengalihkan DB_NAME ke database uji
const models = () => ({
  sequelize: require('../../src/config/database'),
  User: require('../../src/modules/auth/user.model'),
  Product: require('../../src/modules/products/product.model'),
  Cart: require('../../src/modules/cart/cart.model'),
  CartItem: require('../../src/modules/cart/cart_item.model'),
  Order: require('../../src/modules/orders/order.model'),
  OrderItem: require('../../src/modules/orders/order_item.model'),
  Voucher: require('../../src/modules/vouchers/voucher.model'),
  Store: require('../../src/modules/stores/store.model'),
  Courier: require('../../src/modules/couriers/courier.model'),
  Address: require('../../src/modules/addresses/address.model'),
  Favorite: require('../../src/modules/favorites/favorite.model'),
  Review: require('../../src/modules/reviews/review.model'),
  OrderTracking: require('../../src/modules/tracking/tracking.model'),
  Notification: require('../../src/modules/notification/notification.model'),
  SystemLog: require('../../src/modules/sysadmin/system_log.model')
});

// Kosongkan semua tabel (urutan id diulang) antar tes
const resetDb = async () => {
  const { sequelize } = models();
  const [rows] = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  if (rows.length) {
    const list = rows.map(r => `"${r.tablename}"`).join(', ');
    await sequelize.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
  }
  // Kolom baru yang mungkin belum ada di schema.sql lama (hanya database UJI; idempoten)
  await sequelize.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS price_10ml INTEGER');
  await sequelize.query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(255)');
  // Tabel couriers dibuat bila belum ada (schema.sql lama belum memilikinya), lalu diisi kurir bawaan
  const { Courier } = models();
  await Courier.sync({ alter: false });
  await Courier.bulkCreate(Courier.DEFAULTS);
};

const closeDb = async () => { await models().sequelize.close(); };

let seq = 0;
const createUser = async (role = 'customer', overrides = {}) => {
  const { User } = models();
  seq += 1;
  const password = overrides.plainPassword || 'Passw0rd!x';
  return User.create({
    full_name: `User ${role} ${seq}`,
    email: `${role}${seq}@test.local`,
    password: await bcrypt.hash(password, 4),
    role, is_active: true, is_verified: true,
    ...overrides
  });
};

const authHeader = (user) =>
  ({ Authorization: `Bearer ${jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET)}` });

const createProduct = async (overrides = {}) => {
  const { Product } = models();
  const { mlFields } = require('../../src/utils/stockMl');
  const { stock_ml = 50, ...rest } = overrides;
  return Product.create({
    brand: 'TestBrand', product_name: `Parfum ${++seq}`, concentration: 'EDP', gender: 'Unisex',
    main_accords: 'Woody, Citrus', price_1ml: 10000, price_2ml: 18000, price_3ml: 25000, price_5ml: 40000,
    price_10ml: 75000,
    is_active: true, ...mlFields(stock_ml, 50), ...rest
  });
};

const createVoucher = async (overrides = {}) => {
  const { Voucher } = models();
  return Voucher.create({
    code: `VCH${++seq}`, type: 'fixed', value: 5000, min_purchase: 0, quota: 5, is_active: true, ...overrides
  });
};

const createStore = async () => {
  const { Store } = models();
  return Store.create({ name: 'Cabang Test', city: 'Semarang', address: 'Jl. Test 1', is_active: true });
};

// Isi keranjang langsung lewat model (bukan lewat API) supaya tes fokus pada checkout
const fillCart = async (user, product, size_ml = 5, quantity = 2) => {
  const { Cart, CartItem } = models();
  const [cart] = await Cart.findOrCreate({ where: { user_id: user.user_id } });
  const price = product[`price_${size_ml}ml`];
  return CartItem.create({ cart_id: cart.cart_id, product_id: product.product_id, size_ml, quantity, price });
};

// Buat pesanan lewat API checkout (pickup). Mengembalikan body order.
const placeOrder = async (app, user, product, { size = 5, qty = 2, voucher_code } = {}) => {
  const request = require('supertest');
  await fillCart(user, product, size, qty);
  const res = await request(app).post('/api/orders/checkout').set(authHeader(user))
    .send({ delivery_method: 'pickup', ...(voucher_code && { voucher_code }) });
  if (res.status !== 201) throw new Error(`placeOrder gagal: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.order;
};

module.exports = {
  placeOrder,
  describeDb, models, resetDb, closeDb,
  createUser, authHeader, createProduct, createVoucher, createStore, fillCart
};
