const request = require('supertest');
const {
  describeDb, models, resetDb, closeDb, createUser, authHeader,
  createProduct, createVoucher, createStore, fillCart
} = require('./helpers/db');

describeDb('Checkout', () => {
  let app, user, product;
  const checkout = (body = { delivery_method: 'pickup' }) =>
    request(app).post('/api/orders/checkout').set(authHeader(user)).send(body);

  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    user = await createUser();
    product = await createProduct({ stock_ml: 50 });
    await createStore();
  });
  afterAll(closeDb);

  test('stock_ml berkurang sebesar ukuran x jumlah, sold_count naik, keranjang kosong', async () => {
    await fillCart(user, product, 5, 3);
    const res = await checkout();
    expect(res.status).toBe(201);
    expect(res.body.order.total_price).toBe(120000);

    await product.reload();
    expect(Number(product.stock_ml)).toBe(35);
    expect(product.sold_count).toBe(3);
    expect(await models().CartItem.count()).toBe(0);
  });

  test('stok tidak cukup ditolak 400 dan tidak ada yang berubah', async () => {
    await fillCart(user, product, 5, 11);
    const res = await checkout();
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tidak cukup/i);
    await product.reload();
    expect(Number(product.stock_ml)).toBe(50);
    expect(await models().Order.count()).toBe(0);
  });

  test('voucher tidak ada ditolak 400, stok tetap (transaksi rollback)', async () => {
    await fillCart(user, product, 5, 2);
    const res = await checkout({ delivery_method: 'pickup', voucher_code: 'TIDAKADA' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tidak ditemukan/i);
    await product.reload();
    expect(Number(product.stock_ml)).toBe(50);
    expect(await models().Order.count()).toBe(0);
  });

  test('voucher kedaluwarsa, kuota habis, dan di bawah minimum semuanya ditolak', async () => {
    await fillCart(user, product, 5, 2); // subtotal 80000
    const expired = await createVoucher({ expired_at: new Date(Date.now() - 86400000) });
    const full = await createVoucher({ quota: 1, used_count: 1 });
    const minHigh = await createVoucher({ min_purchase: 1000000 });

    expect((await checkout({ delivery_method: 'pickup', voucher_code: expired.code })).status).toBe(400);
    const r2 = await checkout({ delivery_method: 'pickup', voucher_code: full.code });
    expect(r2.status).toBe(400);
    expect(r2.body.message).toMatch(/kuota/i);
    const r3 = await checkout({ delivery_method: 'pickup', voucher_code: minHigh.code });
    expect(r3.status).toBe(400);
    expect(r3.body.message).toMatch(/minimum/i);
    expect(await models().Order.count()).toBe(0);
  });

  test('voucher valid: diskon diterapkan dan used_count naik tepat 1', async () => {
    await fillCart(user, product, 5, 2);
    const v = await createVoucher({ type: 'fixed', value: 5000, quota: 3 });
    const res = await checkout({ delivery_method: 'pickup', voucher_code: v.code });
    expect(res.status).toBe(201);
    expect(res.body.order.discount_amount).toBe(5000);
    expect(res.body.order.total_price).toBe(75000);
    await v.reload();
    expect(v.used_count).toBe(1);
  });

  test('dua checkout bersamaan untuk kuota voucher terakhir: hanya satu berhasil', async () => {
    const other = await createUser();
    await fillCart(user, product, 5, 1);
    await fillCart(other, product, 5, 1);
    const v = await createVoucher({ quota: 1 });
    const call = (u) => request(app).post('/api/orders/checkout').set(authHeader(u))
      .send({ delivery_method: 'pickup', voucher_code: v.code });
    const [a, b] = await Promise.all([call(user), call(other)]);
    expect([a.status, b.status].sort()).toEqual([201, 400]);
    await v.reload();
    expect(v.used_count).toBe(1);
  });

  describe('Harga dan ongkir dihitung server (T20)', () => {
    const total = (res) => res.body.order.total_price;
    const mkAddress = () => models().Address.create({
      user_id: user.user_id, recipient_name: 'R', phone: '08123', province: 'Jawa Tengah',
      city: 'Semarang', city_id: '399', detail: 'Jl. Test 1', label: 'Rumah'
    });

    test('pickup: shipping_cost dari klien (0, negatif, sangat besar) tidak memengaruhi total', async () => {
      for (const fake of [0, -50000, 99999999]) {
        await fillCart(user, product, 5, 1); // subtotal 40000
        const res = await checkout({ delivery_method: 'pickup', shipping_cost: fake });
        expect(res.status).toBe(201);
        expect(total(res)).toBe(40000);
        expect(res.body.order.shipping_cost).toBe(0);
        await models().CartItem.destroy({ where: {} });
        await models().Cart.destroy({ where: {} });
      }
    });

    test('delivery JNE REG: ongkir dari server (22000), shipping_cost palsu diabaikan', async () => {
      const addr = await mkAddress();
      await fillCart(user, product, 5, 1);
      const res = await checkout({
        delivery_method: 'delivery', address_id: addr.address_id,
        courier: 'jne', courier_service: 'REG', shipping_cost: 1
      });
      expect(res.status).toBe(201);
      expect(res.body.order.shipping_cost).toBe(22000);
      expect(total(res)).toBe(62000);
    });

    test('COD: ongkir 0 walau klien mengirim nilai lain', async () => {
      await fillCart(user, product, 5, 1);
      const res = await checkout({
        delivery_method: 'delivery', courier: 'cod', courier_service: 'COD', shipping_cost: 77777,
        shipping_name: 'N', shipping_phone: '08', shipping_address: 'Jl. A', shipping_city: 'Semarang'
      });
      expect(res.status).toBe(201);
      expect(res.body.order.shipping_cost).toBe(0);
      expect(total(res)).toBe(40000);
    });

    test('kurir tidak dikenal, layanan fiktif, dan non-COD dengan alamat manual ditolak 400', async () => {
      const addr = await mkAddress();
      await fillCart(user, product, 5, 1);
      const unknown = await checkout({ delivery_method: 'delivery', address_id: addr.address_id, courier: 'kurir-gaib', courier_service: 'X' });
      expect(unknown.status).toBe(400);
      const fakeService = await checkout({ delivery_method: 'delivery', address_id: addr.address_id, courier: 'jne', courier_service: 'GRATIS' });
      expect(fakeService.status).toBe(400);
      const manual = await checkout({
        delivery_method: 'delivery', courier: 'jne', courier_service: 'REG',
        shipping_name: 'N', shipping_phone: '08', shipping_address: 'Jl. A', shipping_city: 'Semarang'
      });
      expect(manual.status).toBe(400);
      expect(await models().Order.count()).toBe(0);
    });

    test('harga di cart_items yang dimanipulasi tidak dipakai: harga dari produk', async () => {
      const item = await fillCart(user, product, 5, 2);
      await item.update({ price: 1 });
      const res = await checkout();
      expect(res.status).toBe(201);
      expect(total(res)).toBe(80000); // 2 x 40000, bukan 2 x 1
      const items = await models().OrderItem.findAll({ where: { order_id: res.body.order.order_id } });
      expect(items[0].price).toBe(40000);
    });

    test('keranjang berisi jumlah negatif/pecahan atau ukuran tidak valid ditolak', async () => {
      const item = await fillCart(user, product, 5, 1);
      await item.update({ quantity: -3 });
      const res = await checkout();
      expect(res.status).toBe(400);
      await product.reload();
      expect(Number(product.stock_ml)).toBe(50);
    });

    test('produk yang dinonaktifkan setelah masuk keranjang tidak bisa di-checkout', async () => {
      await fillCart(user, product, 5, 1);
      await product.update({ is_active: false });
      expect((await checkout()).status).toBe(400);
    });

    test('addToCart menolak jumlah negatif, nol, pecahan, dan ukuran selain 1/2/3/5', async () => {
      const add = (body) => request(app).post('/api/cart').set(authHeader(user)).send({ product_id: product.product_id, size_ml: 5, ...body });
      expect((await add({ quantity: -2 })).status).toBe(400);
      expect((await add({ quantity: 0 })).status).toBe(400);
      expect((await add({ quantity: 1.5 })).status).toBe(400);
      expect((await add({ size_ml: 4 })).status).toBe(400);
      expect((await add({ quantity: 2 })).status).toBe(200);
    });
  });
});
