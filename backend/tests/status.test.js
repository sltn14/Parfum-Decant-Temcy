const crypto = require('crypto');
const request = require('supertest');
const { describeDb, models, resetDb, closeDb, createUser, authHeader, createProduct, createStore, placeOrder } = require('./helpers/db');

describeDb('Transisi status pesanan (admin)', () => {
  let app, admin, order;
  const setStatus = (status) =>
    request(app).put(`/api/orders/${order.order_id}/status`).set(authHeader(admin)).send({ status });

  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    admin = await createUser('admin');
    const customer = await createUser();
    await createStore();
    order = await placeOrder(app, customer, await createProduct());
  });
  afterAll(closeDb);

  test('urutan maju yang valid diterima', async () => {
    for (const s of ['paid', 'processing', 'shipped', 'delivered']) {
      expect((await setStatus(s)).status).toBe(200);
    }
  });

  test('mundur, status sama, dan status asing ditolak 400', async () => {
    expect((await setStatus('paid')).status).toBe(200);
    expect((await setStatus('pending')).status).toBe(400);
    expect((await setStatus('paid')).status).toBe(400);
    expect((await setStatus('selesai-banget')).status).toBe(400);
  });

  test('cancelled dan delivered bersifat final', async () => {
    expect((await setStatus('cancelled')).status).toBe(200);
    expect((await setStatus('paid')).status).toBe(400);
    expect((await setStatus('pending')).status).toBe(400);
  });

  test('delivered tidak bisa dibatalkan', async () => {
    await setStatus('delivered');
    expect((await setStatus('cancelled')).status).toBe(400);
  });

  test('pembatalan webhook yang bersamaan tidak tertimpa update admin (status dan stok selalu konsisten)', async () => {
    const customer = await createUser();
    for (let i = 0; i < 3; i++) {
      const product = await createProduct({ stock_ml: 50 });
      const o = await placeOrder(app, customer, product, { qty: 2 });
      const order_id = `${o.order_code}-1700000000000`;
      const gross_amount = `${o.total_price}.00`;
      const signature_key = crypto.createHash('sha512')
        .update(`${order_id}200${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`).digest('hex');

      await Promise.all([
        request(app).post('/api/orders/webhook/midtrans')
          .send({ order_id, status_code: '200', gross_amount, transaction_status: 'expire', signature_key }),
        request(app).put(`/api/orders/${o.order_id}/status`).set(authHeader(admin)).send({ status: 'paid' })
      ]);

      const finalOrder = await models().Order.findByPk(o.order_id);
      await product.reload();
      // cancelled <=> stok dikembalikan penuh (10); paid <=> stok tetap berkurang (8). Tidak boleh campur.
      if (finalOrder.status === 'cancelled') expect(Number(product.stock_ml)).toBe(50);
      else { expect(finalOrder.status).toBe('paid'); expect(Number(product.stock_ml)).toBe(40); }
    }
  });
});
