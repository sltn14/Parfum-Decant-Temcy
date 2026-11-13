const request = require('supertest');
const { describeDb, models, resetDb, closeDb, createUser, authHeader, createProduct, createVoucher } = require('./helpers/db');

describeDb('Whitelist field (mass assignment)', () => {
  let app, admin, customer;
  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    admin = await createUser('admin');
    customer = await createUser();
  });
  afterAll(closeDb);

  test('create produk: sold_count dari klien diabaikan, stock_ml (stok awal) dipakai, vial lama diabaikan', async () => {
    const res = await request(app).post('/api/products').set(authHeader(admin)).send({
      brand: 'B', product_name: 'P', price_1ml: 1000, price_5ml: 4000, price_10ml: 7500,
      stock_ml: 80, sold_count: 500, stock_5ml: 4, stock_1ml: 3
    });
    expect(res.status).toBe(201);
    expect(res.body.product.sold_count).toBe(0);
    expect(Number(res.body.product.stock_ml)).toBe(80);
    expect(res.body.product.price_10ml).toBe(7500);
    expect(res.body.product.stock_5ml).toBe(0);
  });

  test('update produk: sold_count dan stock_ml tidak bisa diubah lewat edit produk', async () => {
    const p = await createProduct({ stock_ml: 50 });
    const res = await request(app).put(`/api/products/${p.product_id}`).set(authHeader(admin))
      .send({ brand: 'Baru', sold_count: 777, stock_ml: 1 });
    expect(res.status).toBe(200);
    await p.reload();
    expect(p.brand).toBe('Baru');
    expect(p.sold_count).toBe(0);
    expect(Number(p.stock_ml)).toBe(50);
  });

  test('voucher: used_count tidak bisa diatur saat create maupun update', async () => {
    const created = await request(app).post('/api/vouchers/admin').set(authHeader(admin))
      .send({ code: 'hemat', type: 'fixed', value: 1000, quota: 5, used_count: 4 });
    expect(created.status).toBe(201);
    expect(created.body.voucher.used_count).toBe(0);
    expect(created.body.voucher.code).toBe('HEMAT');

    const upd = await request(app).put(`/api/vouchers/admin/${created.body.voucher.voucher_id}`).set(authHeader(admin))
      .send({ value: 2000, used_count: 4 });
    expect(upd.status).toBe(200);
    const v = await models().Voucher.findByPk(created.body.voucher.voucher_id);
    expect(v.value).toBe(2000);
    expect(v.used_count).toBe(0);
  });

  test('alamat: user_id dari body diabaikan, selalu pemilik token', async () => {
    const res = await request(app).post('/api/addresses').set(authHeader(customer)).send({
      user_id: admin.user_id, recipient_name: 'R', phone: '08123', province: 'Jateng',
      city: 'Semarang', detail: 'Jl. A', label: 'Rumah'
    });
    expect(res.status).toBe(201);
    expect(res.body.address.user_id).toBe(customer.user_id);
  });

  test('pelanggan tidak bisa mengubah alamat milik orang lain', async () => {
    const mine = await request(app).post('/api/addresses').set(authHeader(admin)).send({
      recipient_name: 'R', phone: '08123', province: 'Jateng', city: 'Semarang', detail: 'Jl. A'
    });
    const res = await request(app).put(`/api/addresses/${mine.body.address.address_id}`)
      .set(authHeader(customer)).send({ detail: 'dibajak' });
    expect(res.status).toBe(404);
  });
});
