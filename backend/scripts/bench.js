// Pengukuran waktu respons dengan autocannon (T15). Belum pernah dijalankan dari sandbox penulis.
//
// PERSIAPAN
//   1. Database uji + schema.sql sudah siap (lihat tests/README.md) dan `npm install -D autocannon`.
//   2. Jalankan server API ke database UJI (dotenv tidak menimpa variabel yang sudah ada):
//        DB_NAME=decant_temcy_test node src/app.js
//   3. Di terminal lain:  npm run bench
//
// Skrip ini mengisi database uji (admin, customer, 40 produk, 12 pesanan) lewat model,
// lalu mengukur tiap endpoint lewat HTTP. Opsi: BASE_URL (default http://localhost:5000),
// BENCH_DURATION detik (default 10), BENCH_CONNECTIONS (default 10).
//
// CATATAN
// - autocannon tidak melaporkan p95; tabel memuat p90 dan p97.5 (p95 berada di antaranya).
// - Login dibatasi 20 percobaan/15 menit per IP (rate limiter), jadi login diukur dengan
//   15 permintaan berurutan, bukan beban berkelanjutan. Itu memang perilaku yang diinginkan.
// - Chatbot diukur TERPISAH di dalam proses ini dengan Gemini di-mock: waktu Gemini asli TIDAK diukur.
const fs = require('fs');
const path = require('path');
const { ready, reason } = require('../tests/helpers/ready');

if (!ready) { console.error(`Tidak bisa jalan: ${reason}`); process.exit(1); }
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.DB_NAME = process.env.DB_NAME_TEST; // seed ke database uji

const autocannon = require('autocannon');
const bcrypt = require('bcryptjs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const DURATION = parseInt(process.env.BENCH_DURATION) || 10;
const CONNECTIONS = parseInt(process.env.BENCH_CONNECTIONS) || 10;
const TARGET_MS = 5000; // DTP-04: waktu respons < 5 detik
const PASSWORD = 'Bench!2345';

const row = (name, r) => ({
  endpoint: name,
  reqPerSec: Math.round(r.requests.average),
  avgMs: r.latency.average,
  p90Ms: r.latency.p90,
  p975Ms: r.latency.p97_5,
  maxMs: r.latency.max,
  total: r.requests.total,
  non2xx: r.non2xx + (r.errors || 0) + (r.timeouts || 0),
  withinTarget: r.latency.max < TARGET_MS
});

const run = (opts) => autocannon({ connections: CONNECTIONS, duration: DURATION, ...opts });

const seed = async () => {
  const { sequelize, User, Product, Order, OrderItem, Cart, CartItem } = {
    sequelize: require('../src/config/database'),
    User: require('../src/modules/auth/user.model'),
    Product: require('../src/modules/products/product.model'),
    Order: require('../src/modules/orders/order.model'),
    OrderItem: require('../src/modules/orders/order_item.model'),
    Cart: require('../src/modules/cart/cart.model'),
    CartItem: require('../src/modules/cart/cart_item.model')
  };
  const hash = await bcrypt.hash(PASSWORD, 8);
  const stamp = Date.now();
  const admin = await User.create({ full_name: 'Bench Admin', email: `bench-admin-${stamp}@test.local`, password: hash, role: 'admin', is_active: true, is_verified: true });
  const customer = await User.create({ full_name: 'Bench Customer', email: `bench-cust-${stamp}@test.local`, password: hash, role: 'customer', is_active: true, is_verified: true });

  const products = [];
  for (let i = 1; i <= 40; i++) {
    products.push(await Product.create({
      brand: `Brand ${i % 8}`, product_name: `Bench Parfum ${i}`, concentration: i % 2 ? 'EDP' : 'EDT',
      gender: ['Male', 'Female', 'Unisex'][i % 3], main_accords: 'Woody, Citrus, Vanilla',
      price_1ml: 10000 + i * 100, price_2ml: 19000, price_3ml: 27000, price_5ml: 42000,
      stock_1ml: 5, stock_2ml: 5, stock_3ml: 5, stock_5ml: 5, stock_ml: 55, stock_ml_initial: 55,
      sold_count: i * 3, is_active: true
    }));
  }
  for (let i = 0; i < 12; i++) {
    const o = await Order.create({
      user_id: customer.user_id, order_code: `TM-BENCH-${stamp}-${i}`, total_price: 84000,
      status: ['pending', 'paid', 'delivered'][i % 3], delivery_method: 'pickup',
      shipping_name: 'Bench', shipping_phone: '08', shipping_address: 'x', shipping_city: 'Semarang'
    });
    await OrderItem.create({ order_id: o.order_id, product_id: products[i].product_id, product_name: products[i].product_name, brand: products[i].brand, size_ml: 5, quantity: 2, price: 42000 });
  }
  const cart = await Cart.create({ user_id: customer.user_id });
  for (let i = 0; i < 3; i++) await CartItem.create({ cart_id: cart.cart_id, product_id: products[i].product_id, size_ml: 5, quantity: 1, price: 42000 });

  return { sequelize, admin, customer, productId: products[0].product_id };
};

const login = async (email) => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD })
  });
  const body = await res.json();
  if (!body.token) throw new Error(`Login gagal (${res.status}). Pastikan server berjalan di database UJI: ${JSON.stringify(body)}`);
  return body.token;
};

const printTable = (title, rows) => {
  console.log(`\n${title}`);
  console.log('| Endpoint | req/s | rata-rata ms | p90 ms | p97.5 ms | maks ms | total | non-2xx | maks < 5 dtk |');
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|:--:|');
  for (const r of rows) {
    console.log(`| ${r.endpoint} | ${r.reqPerSec} | ${r.avgMs} | ${r.p90Ms} | ${r.p975Ms} | ${r.maxMs} | ${r.total} | ${r.non2xx} | ${r.withinTarget ? 'ya' : 'TIDAK'} |`);
  }
};

(async () => {
  const { sequelize, admin, customer, productId } = await seed();
  const customerToken = await login(customer.email);
  const adminToken = await login(admin.email);
  const auth = (t) => ({ authorization: `Bearer ${t}` });

  const rows = [];
  rows.push(row('GET /api/products', await run({ url: `${BASE_URL}/api/products?page=1&limit=15` })));
  rows.push(row('GET /api/products/:id', await run({ url: `${BASE_URL}/api/products/${productId}` })));
  rows.push(row('GET /api/cart', await run({ url: `${BASE_URL}/api/cart`, headers: auth(customerToken) })));
  rows.push(row('GET /api/orders/my-orders', await run({ url: `${BASE_URL}/api/orders/my-orders?page=1&limit=10`, headers: auth(customerToken) })));
  rows.push(row('GET /api/admin/dashboard', await run({ url: `${BASE_URL}/api/admin/dashboard`, headers: auth(adminToken) })));
  rows.push(row('GET /api/recommendations/popular', await run({ url: `${BASE_URL}/api/recommendations/popular` })));
  // Login: 15 permintaan berurutan (rate limiter 20/15 menit; 2 login sudah dipakai untuk token)
  rows.push(row('POST /api/auth/login (15 permintaan berurutan)', await autocannon({
    url: `${BASE_URL}/api/auth/login`, method: 'POST', connections: 1, amount: 15,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: customer.email, password: PASSWORD })
  })));
  printTable(`Hasil terhadap ${BASE_URL} (${DURATION} dtk, ${CONNECTIONS} koneksi, target maks < ${TARGET_MS} ms)`, rows);

  // ---- Chatbot, Gemini di-mock, server di dalam proses ini ----
  const Module = require('module');
  const origLoad = Module._load;
  Module._load = function (request, ...rest) {
    if (request === '@google/genai') {
      return { GoogleGenAI: class { constructor() { this.models = { generateContent: async () => ({ text: 'balasan mock' }) }; } } };
    }
    return origLoad.call(this, request, ...rest);
  };
  process.env.GEMINI_API_KEY = 'mock';
  const { httpServer } = require('../src/app');
  await new Promise(r => httpServer.listen(0, r));
  const port = httpServer.address().port;
  const chat = row('POST /api/chatbot (Gemini di-MOCK)', await run({
    url: `http://localhost:${port}/api/chatbot`, method: 'POST',
    headers: { ...auth(customerToken), 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'rekomendasi parfum woody', session_id: 'bench' })
  }));
  printTable('Chatbot terpisah (hanya waktu proses backend; waktu Gemini asli TIDAK diukur)', [chat]);
  rows.push(chat);

  fs.writeFileSync(path.join(__dirname, 'bench-results.json'), JSON.stringify({ at: new Date().toISOString(), baseUrl: BASE_URL, duration: DURATION, connections: CONNECTIONS, rows }, null, 2));
  console.log('\nHasil mentah: backend/scripts/bench-results.json');
  httpServer.close();
  await sequelize.close();
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
