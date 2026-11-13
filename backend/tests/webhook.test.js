const crypto = require('crypto');
const request = require('supertest');
const {
  describeDb, models, resetDb, closeDb, createUser, createProduct, createVoucher, createStore, placeOrder
} = require('./helpers/db');

const sign = (orderId, statusCode, gross) =>
  crypto.createHash('sha512').update(`${orderId}${statusCode}${gross}${process.env.MIDTRANS_SERVER_KEY}`).digest('hex');

describeDb('Webhook Midtrans', () => {
  let app, user, product, voucher, order, sendOrderEmail;
  const notify = (transaction_status, { badSignature = false } = {}) => {
    const order_id = `${order.order_code}-1700000000000`;
    const status_code = '200';
    const gross_amount = `${order.total_price}.00`;
    return request(app).post('/api/orders/webhook/midtrans').send({
      order_id, status_code, gross_amount, transaction_status, fraud_status: 'accept',
      signature_key: badSignature ? 'salah' : sign(order_id, status_code, gross_amount)
    });
  };

  beforeAll(() => {
    ({ app } = require('../src/app'));
    ({ sendOrderEmail } = require('../src/utils/emailHelper'));
  });
  beforeEach(async () => {
    await resetDb();
    jest.clearAllMocks();
    user = await createUser();
    await createStore();
    product = await createProduct({ stock_ml: 50 });
    voucher = await createVoucher({ type: 'fixed', value: 5000 });
    order = await placeOrder(app, user, product, { qty: 2, voucher_code: voucher.code });
  });
  afterAll(closeDb);

  test('signature salah ditolak 403 dan status tidak berubah', async () => {
    expect((await notify('settlement', { badSignature: true })).status).toBe(403);
    expect((await models().Order.findByPk(order.order_id)).status).toBe('pending');
  });

  test('signature benar: settlement mengubah status menjadi paid', async () => {
    expect((await notify('settlement')).status).toBe(200);
    expect((await models().Order.findByPk(order.order_id)).status).toBe('paid');
  });

  test('settlement ganda idempoten: satu email dan satu notifikasi', async () => {
    await notify('settlement');
    await notify('settlement');
    expect(sendOrderEmail).toHaveBeenCalledTimes(1);
    expect(await models().Notification.count({ where: { user_id: user.user_id } })).toBe(1);
  });

  test('expire ganda: stok dan voucher kembali sekali, satu email', async () => {
    await notify('expire');
    await notify('expire');
    await notify('deny');
    await product.reload(); await voucher.reload();
    expect(Number(product.stock_ml)).toBe(50);
    expect(voucher.used_count).toBe(0);
    expect((await models().Order.findByPk(order.order_id)).status).toBe('cancelled');
    expect(sendOrderEmail).toHaveBeenCalledTimes(1);
  });

  test('expire setelah paid tidak membatalkan pesanan', async () => {
    await notify('settlement');
    await notify('expire');
    expect((await models().Order.findByPk(order.order_id)).status).toBe('paid');
    await product.reload();
    expect(Number(product.stock_ml)).toBe(40);
  });
});
