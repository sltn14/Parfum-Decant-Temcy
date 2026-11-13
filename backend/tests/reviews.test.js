const request = require('supertest');
const { describeDb, models, resetDb, closeDb, createUser, authHeader, createProduct, createStore, placeOrder } = require('./helpers/db');

describeDb('Ulasan: validasi rating, komentar, dan produk', () => {
  let app, user, product;
  const post = (body, u = user) => request(app).post('/api/reviews').set(authHeader(u)).send(body);

  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    user = await createUser();
    await createStore();
    product = await createProduct();
  });
  afterAll(closeDb);

  const buyAndDeliver = async () => {
    const o = await placeOrder(app, user, product, { qty: 1 });
    await models().Order.update({ status: 'delivered' }, { where: { order_id: o.order_id } });
  };

  test('rating bukan bilangan bulat 1-5 ditolak 400', async () => {
    await buyAndDeliver();
    for (const bad of [0, 6, -1, 2.5, 'abc', true, [], {}]) {
      const res = await post({ product_id: product.product_id, rating: bad });
      expect(res.status).toBe(400);
    }
  });

  test('komentar bukan string atau lebih dari 1000 karakter ditolak 400', async () => {
    await buyAndDeliver();
    expect((await post({ product_id: product.product_id, rating: 5, comment: 12345 })).status).toBe(400);
    expect((await post({ product_id: product.product_id, rating: 5, comment: 'a'.repeat(1001) })).status).toBe(400);
  });

  test('produk tidak ada: 404 (bukan 500)', async () => {
    expect((await post({ product_id: 99999, rating: 5 })).status).toBe(404);
  });

  test('belum membeli atau belum delivered: 403 (aturan lama tetap)', async () => {
    expect((await post({ product_id: product.product_id, rating: 5 })).status).toBe(403);
    await placeOrder(app, user, product, { qty: 1 }); // masih pending
    expect((await post({ product_id: product.product_id, rating: 5 })).status).toBe(403);
  });

  test('setelah delivered: ulasan valid 201, ulasan kedua 400', async () => {
    await buyAndDeliver();
    const ok = await post({ product_id: product.product_id, rating: 4, comment: 'Wangi tahan lama' });
    expect(ok.status).toBe(201);
    expect(ok.body.review.rating).toBe(4);
    expect((await post({ product_id: product.product_id, rating: 5 })).status).toBe(400);
  });

  test('update: rating dan komentar divalidasi, nilai valid tersimpan', async () => {
    await buyAndDeliver();
    const created = await post({ product_id: product.product_id, rating: 3 });
    const id = created.body.review.review_id;
    const put = (body) => request(app).put(`/api/reviews/${id}`).set(authHeader(user)).send(body);

    expect((await put({ rating: 9 })).status).toBe(400);
    expect((await put({ rating: 4, comment: 'a'.repeat(1001) })).status).toBe(400);
    expect((await put({ comment: 'tanpa rating' })).status).toBe(400);
    const ok = await put({ rating: 5, comment: 'Update' });
    expect(ok.status).toBe(200);
    expect(ok.body.review.rating).toBe(5);
  });

  test('edit dan hapus hanya untuk pemilik ulasan; setelah dihapus bisa menulis ulang', async () => {
    await buyAndDeliver();
    const created = await post({ product_id: product.product_id, rating: 3, comment: 'Awal' });
    const id = created.body.review.review_id;
    const other = await createUser();

    // Pengguna lain tidak boleh mengubah atau menghapus (404, bukan 403, supaya id tidak bocor)
    expect((await request(app).put(`/api/reviews/${id}`).set(authHeader(other)).send({ rating: 1 })).status).toBe(404);
    expect((await request(app).delete(`/api/reviews/${id}`).set(authHeader(other))).status).toBe(404);

    // Pemilik menghapus: hilang dari daftar publik, can-review kembali true
    expect((await request(app).delete(`/api/reviews/${id}`).set(authHeader(user))).status).toBe(200);
    const list = await request(app).get(`/api/reviews/product/${product.product_id}`);
    expect(list.body.reviews.length).toBe(0);
    const can = await request(app).get(`/api/reviews/can-review/${product.product_id}`).set(authHeader(user));
    expect(can.body.can_review).toBe(true);
    expect(can.body.has_reviewed).toBe(false);

    // Ulasan yang sudah dihapus tidak bisa diedit atau dihapus lagi
    expect((await request(app).put(`/api/reviews/${id}`).set(authHeader(user)).send({ rating: 5 })).status).toBe(404);
    expect((await request(app).delete(`/api/reviews/${id}`).set(authHeader(user))).status).toBe(404);

    // Menulis ulang berhasil (baris lama dipakai lagi), tetap satu ulasan per produk
    const again = await post({ product_id: product.product_id, rating: 5, comment: 'Ulasan baru' });
    expect(again.status).toBe(201);
    expect(again.body.review.rating).toBe(5);
    expect(await models().Review.count({ where: { user_id: user.user_id, product_id: product.product_id } })).toBe(1);
    expect((await post({ product_id: product.product_id, rating: 2 })).status).toBe(400);
  });
});
