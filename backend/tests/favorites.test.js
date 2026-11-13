const request = require('supertest');
const { describeDb, models, resetDb, closeDb, createUser, authHeader, createProduct } = require('./helpers/db');

describeDb('Favorit: produk harus ada dan aktif', () => {
  let app, user;
  const toggle = (body) => request(app).post('/api/favorites/toggle').set(authHeader(user)).send(body);

  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => { await resetDb(); user = await createUser(); });
  afterAll(closeDb);

  test('produk aktif: tambah lalu hapus', async () => {
    const p = await createProduct();
    const a = await toggle({ product_id: p.product_id });
    expect(a.status).toBe(200);
    expect(a.body.is_favorite).toBe(true);
    const b = await toggle({ product_id: p.product_id });
    expect(b.body.is_favorite).toBe(false);
  });

  test('produk tidak ada: 404 dan tidak ada baris favorit', async () => {
    expect((await toggle({ product_id: 99999 })).status).toBe(404);
    expect(await models().Favorite.count({ where: { user_id: user.user_id } })).toBe(0);
  });

  test('produk nonaktif: 404 saat menambah', async () => {
    const p = await createProduct({ is_active: false });
    expect((await toggle({ product_id: p.product_id })).status).toBe(404);
    expect(await models().Favorite.count({ where: { user_id: user.user_id } })).toBe(0);
  });

  test('favorit lama tetap bisa dihapus setelah produk dinonaktifkan', async () => {
    const p = await createProduct();
    await toggle({ product_id: p.product_id });
    await models().Product.update({ is_active: false }, { where: { product_id: p.product_id } });
    const res = await toggle({ product_id: p.product_id });
    expect(res.status).toBe(200);
    expect(res.body.is_favorite).toBe(false);
  });

  test('product_id kosong / bukan angka: 400', async () => {
    expect((await toggle({})).status).toBe(400);
    expect((await toggle({ product_id: 'abc' })).status).toBe(400);
    expect((await toggle({ product_id: 1.5 })).status).toBe(400);
  });
});
