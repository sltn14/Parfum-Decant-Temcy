const request = require('supertest');
const { describeDb, models, resetDb, closeDb, createUser, authHeader, createProduct, createStore, fillCart } = require('./helpers/db');
const { maxQtyForSize, mlNeeded } = require('../src/utils/stockMl');

describe('Util stok ml (tanpa database)', () => {
  test('maxQtyForSize: sisa ml dibagi ukuran, dibulatkan ke bawah', () => {
    expect(maxQtyForSize(9, 10)).toBe(0);
    expect(maxQtyForSize(9, 5)).toBe(1);
    expect(maxQtyForSize(50, 10)).toBe(5);
    expect(maxQtyForSize('23.5', 3)).toBe(7);
    expect(maxQtyForSize(50, 4)).toBe(0); // ukuran tidak valid
  });
  test('mlNeeded: jumlah ukuran x qty', () => {
    expect(mlNeeded([{ size_ml: 3, quantity: 2 }, { size_ml: 10, quantity: 4 }])).toBe(46);
    expect(mlNeeded([])).toBe(0);
  });
});

describeDb('Stok berbasis ml (botol besar)', () => {
  let app, user, admin, product;
  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    user = await createUser();
    admin = await createUser('admin');
    await createStore(); // checkout pickup butuh minimal satu store aktif
    product = await createProduct({ stock_ml: 12 });
  });
  afterAll(closeDb);

  const add = (size_ml, quantity) => request(app).post('/api/cart').set(authHeader(user))
    .send({ product_id: product.product_id, size_ml, quantity });
  const checkout = () => request(app).post('/api/orders/checkout').set(authHeader(user))
    .send({ delivery_method: 'pickup' });

  test('keranjang: 10 ml bisa 1 pcs, 2 pcs ditolak (sisa 12 ml)', async () => {
    expect((await add(10, 1)).status).toBe(200);
    const res = await add(10, 1);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/maksimal|tidak cukup/i);
  });

  test('keranjang: ml yang sudah dipakai ukuran lain ikut dihitung', async () => {
    expect((await add(10, 1)).status).toBe(200);   // sisa 2 ml
    expect((await add(3, 1)).status).toBe(400);    // 3 > 2
    expect((await add(2, 1)).status).toBe(200);    // 2 <= 2
    expect((await add(1, 1)).status).toBe(400);    // sudah habis
  });

  test('ukuran di luar 1/2/3/5/10 ditolak', async () => {
    expect((await add(4, 1)).status).toBe(400);
  });

  test('checkout campuran ukuran mengurangi ml sebesar ukuran x jumlah', async () => {
    await fillCart(user, product, 10, 1);
    await fillCart(user, product, 1, 2);
    const res = await checkout();
    expect(res.status).toBe(201);
    await product.reload();
    expect(Number(product.stock_ml)).toBe(0);
    expect(product.sold_count).toBe(3);
  });

  test('checkout ditolak kalau total ml melebihi sisa, stok tidak berubah', async () => {
    await fillCart(user, product, 10, 1);
    await fillCart(user, product, 3, 1); // 13 > 12
    const res = await checkout();
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tidak cukup/i);
    await product.reload();
    expect(Number(product.stock_ml)).toBe(12);
    expect(await models().Order.count()).toBe(0);
  });

  test('admin atur stok lewat PATCH /:id/stock (stock_ml), nilai negatif ditolak', async () => {
    const ok = await request(app).patch(`/api/products/${product.product_id}/stock`)
      .set(authHeader(admin)).send({ stock_ml: 75.5 });
    expect(ok.status).toBe(200);
    await product.reload();
    expect(Number(product.stock_ml)).toBe(75.5);
    expect(Number(product.stock_ml_initial)).toBeGreaterThanOrEqual(75.5);

    const bad = await request(app).patch(`/api/products/${product.product_id}/stock`)
      .set(authHeader(admin)).send({ stock_ml: -1 });
    expect(bad.status).toBe(400);
    const empty = await request(app).patch(`/api/products/${product.product_id}/stock`)
      .set(authHeader(admin)).send({});
    expect(empty.status).toBe(400);
  });
});
