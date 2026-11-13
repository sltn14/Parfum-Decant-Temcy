const request = require('supertest');
const { describeDb, models, resetDb, closeDb, createUser, authHeader, createProduct, fillCart } = require('./helpers/db');

describeDb('Keranjang: item hanya milik pemilik (IDOR)', () => {
  let app, userA, userB, product, itemA;
  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    userA = await createUser();
    userB = await createUser();
    product = await createProduct({ stock_ml: 50 });
    itemA = await fillCart(userA, product, 5, 2);
  });
  afterAll(closeDb);

  const update = (u, id, quantity) => request(app).put(`/api/cart/${id}`).set(authHeader(u)).send({ quantity });
  const remove = (u, id) => request(app).delete(`/api/cart/${id}`).set(authHeader(u));

  test('pengguna B tidak bisa mengubah item milik A (404) dan item A tidak berubah', async () => {
    const res = await update(userB, itemA.cart_item_id, 5);
    expect(res.status).toBe(404);
    await itemA.reload();
    expect(itemA.quantity).toBe(2);
  });

  test('pengguna B tidak bisa menghapus item milik A (404) dan item A tetap ada', async () => {
    expect((await remove(userB, itemA.cart_item_id)).status).toBe(404);
    expect(await models().CartItem.count({ where: { cart_item_id: itemA.cart_item_id } })).toBe(1);
  });

  test('pengguna B juga tidak bisa "menghapus" lewat quantity 0 milik A', async () => {
    expect((await update(userB, itemA.cart_item_id, 0)).status).toBe(404);
    expect(await models().CartItem.count({ where: { cart_item_id: itemA.cart_item_id } })).toBe(1);
  });

  test('pemilik tetap bisa mengubah dan menghapus item miliknya', async () => {
    expect((await update(userA, itemA.cart_item_id, 4)).status).toBe(200);
    await itemA.reload();
    expect(itemA.quantity).toBe(4);
    expect((await remove(userA, itemA.cart_item_id)).status).toBe(200);
    expect(await models().CartItem.count()).toBe(0);
  });

  test('id bukan angka dan id yang tidak ada: 404', async () => {
    expect((await update(userA, 'abc', 1)).status).toBe(404);
    expect((await remove(userA, 999999)).status).toBe(404);
  });

  test('quantity maksimum 99 per item dan harus bilangan bulat', async () => {
    await product.update({ stock_ml: 2500 });
    expect((await update(userA, itemA.cart_item_id, 100)).status).toBe(400);
    expect((await update(userA, itemA.cart_item_id, 'abc')).status).toBe(400);
    expect((await update(userA, itemA.cart_item_id, 99)).status).toBe(200);
  });
});
