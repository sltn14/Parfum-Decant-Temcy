const request = require('supertest');
const {
  describeDb, resetDb, closeDb, createUser, authHeader, createProduct, createVoucher, createStore, placeOrder
} = require('./helpers/db');

describeDb('Pembatalan: stok dan voucher kembali tepat sekali', () => {
  let app, user, admin, product, voucher, order;
  const cancel = () => request(app).put(`/api/orders/my-orders/${order.order_id}/cancel`).set(authHeader(user));

  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    user = await createUser();
    admin = await createUser('admin');
    await createStore();
    product = await createProduct({ stock_ml: 50 });
    voucher = await createVoucher({ type: 'fixed', value: 5000, quota: 5 });
    order = await placeOrder(app, user, product, { qty: 3, voucher_code: voucher.code });
    await product.reload(); await voucher.reload();
    expect(Number(product.stock_ml)).toBe(35);
    expect(voucher.used_count).toBe(1);
  });
  afterAll(closeDb);

  test('pembatalan pelanggan mengembalikan stok dan voucher', async () => {
    expect((await cancel()).status).toBe(200);
    await product.reload(); await voucher.reload();
    expect(Number(product.stock_ml)).toBe(50);
    expect(Number(product.stock_ml)).toBe(50);
    expect(product.sold_count).toBe(0);
    expect(voucher.used_count).toBe(0);
  });

  test('dua pembatalan bersamaan: satu 200, satu 400, stok dan voucher kembali sekali', async () => {
    const [a, b] = await Promise.all([cancel(), cancel()]);
    expect([a.status, b.status].sort()).toEqual([200, 400]);
    await product.reload(); await voucher.reload();
    expect(Number(product.stock_ml)).toBe(50);
    expect(voucher.used_count).toBe(0);
  });

  test('pembatalan ulang setelah berhasil ditolak dan tidak memulihkan lagi', async () => {
    await cancel();
    expect((await cancel()).status).toBe(400);
    await product.reload();
    expect(Number(product.stock_ml)).toBe(50);
  });

  test('pembatalan oleh admin juga memulihkan stok dan voucher sekali', async () => {
    const res = await request(app).put(`/api/orders/${order.order_id}/status`).set(authHeader(admin)).send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    await product.reload(); await voucher.reload();
    expect(Number(product.stock_ml)).toBe(50);
    expect(voucher.used_count).toBe(0);
  });

  test('pesanan yang sudah dibayar tidak bisa dibatalkan pelanggan', async () => {
    await request(app).put(`/api/orders/${order.order_id}/status`).set(authHeader(admin)).send({ status: 'paid' });
    expect((await cancel()).status).toBe(400);
    await product.reload();
    expect(Number(product.stock_ml)).toBe(35);
  });
});
