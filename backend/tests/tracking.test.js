const request = require('supertest');
const { describeDb, models, resetDb, closeDb, createUser, authHeader, createProduct, createStore, placeOrder } = require('./helpers/db');

describeDb('Tracking: validasi input admin', () => {
  let app, admin, customer, order;
  const post = (body, u = admin) => request(app).post('/api/tracking').set(authHeader(u)).send(body);
  const valid = () => ({ order_id: order.order_id, courier: 'JNE', tracking_number: 'JNE123456' });

  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    admin = await createUser('admin');
    customer = await createUser();
    await createStore();
    order = await placeOrder(app, customer, await createProduct(), { qty: 1 });
    // placeOrder membuat pesanan pickup; tracking hanya untuk pesanan pengiriman
    await models().Order.update({ delivery_method: 'delivery' }, { where: { order_id: order.order_id } });
  });

  test('pesanan pickup ditolak: 400 (tidak memakai kurir dan resi)', async () => {
    await models().Order.update({ delivery_method: 'pickup' }, { where: { order_id: order.order_id } });
    const res = await post(valid());
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/pickup/i);
  });
  afterAll(closeDb);

  test('customer tidak boleh: 403', async () => {
    expect((await post(valid(), customer)).status).toBe(403);
  });

  test('order tidak ada: 404; order_id kosong/bukan angka: 400', async () => {
    expect((await post({ ...valid(), order_id: 99999 })).status).toBe(404);
    expect((await post({ ...valid(), order_id: undefined })).status).toBe(400);
    expect((await post({ ...valid(), order_id: 'abc' })).status).toBe(400);
  });

  test('courier / tracking_number kosong, spasi, atau bukan string: 400', async () => {
    for (const bad of ['', '   ', null, 123, {}]) {
      expect((await post({ ...valid(), courier: bad })).status).toBe(400);
      expect((await post({ ...valid(), tracking_number: bad })).status).toBe(400);
    }
  });

  test('melebihi panjang kolom: 400 (courier 50, resi 100, status 100, lokasi 200)', async () => {
    expect((await post({ ...valid(), courier: 'a'.repeat(51) })).status).toBe(400);
    expect((await post({ ...valid(), tracking_number: 'a'.repeat(101) })).status).toBe(400);
    expect((await post({ ...valid(), status: 'a'.repeat(101) })).status).toBe(400);
    expect((await post({ ...valid(), location: 'a'.repeat(201) })).status).toBe(400);
  });

  test('berhasil: tracking dibuat, resi di order ikut, audit tercatat', async () => {
    const res = await post({ ...valid(), status: 'Dikirim', description: 'Paket diambil kurir', location: '' });
    expect(res.status).toBe(200);
    const { Order, OrderTracking, SystemLog } = models();
    expect((await Order.findByPk(order.order_id)).tracking_number).toBe('JNE123456');
    const t = await OrderTracking.findOne({ where: { order_id: order.order_id } });
    expect(t.courier).toBe('JNE');
    expect(t.status).toBe('Dikirim');
    const logs = await SystemLog.findAll({ where: { source: 'audit' } });
    expect(logs.some(l => l.metadata?.action === 'update_tracking' && l.metadata?.entity_id === order.order_id)).toBe(true);
  });

  test('update berikutnya mengubah baris yang sama; permintaan kosong tidak menimpa data lama', async () => {
    await post({ ...valid(), description: 'Awal' });
    expect((await post({ ...valid(), courier: '' })).status).toBe(400);
    const res = await post({ ...valid(), tracking_number: 'JNE999', description: '' });
    expect(res.status).toBe(200);
    const { OrderTracking } = models();
    expect(await OrderTracking.count({ where: { order_id: order.order_id } })).toBe(1);
    const t = await OrderTracking.findOne({ where: { order_id: order.order_id } });
    expect(t.tracking_number).toBe('JNE999');
    expect(t.description).toBe('Awal'); // deskripsi kosong tidak menghapus yang lama
  });
});
