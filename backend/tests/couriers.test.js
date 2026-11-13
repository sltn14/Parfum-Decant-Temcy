const request = require('supertest');
const { describeDb, models, resetDb, closeDb, createUser, authHeader } = require('./helpers/db');

describeDb('Kurir: pengaturan admin dan pemakaian di pengiriman', () => {
  let app, admin, customer;
  const get = (url, u) => request(app).get(url).set(u ? authHeader(u) : {});
  const post = (url, body, u = admin) => request(app).post(url).set(authHeader(u)).send(body);
  const put = (url, body, u = admin) => request(app).put(url).set(authHeader(u)).send(body);
  const del = (url, u = admin) => request(app).delete(url).set(authHeader(u));

  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    admin = await createUser('admin');
    customer = await createUser();
  });
  afterAll(closeDb);

  test('publik: hanya kurir aktif, berurutan, tanpa data internal', async () => {
    const { Courier } = models();
    await Courier.update({ is_active: false }, { where: { code: 'jnt' } });
    const res = await get('/api/couriers');
    expect(res.status).toBe(200);
    expect(res.body.couriers.map(c => c.code)).toEqual(['jne', 'sicepat', 'cod']);
    expect(Object.keys(res.body.couriers[0]).sort()).toEqual(['code', 'name']);
  });

  test('rute admin: tanpa login 401, customer 403', async () => {
    expect((await get('/api/couriers/admin')).status).toBe(401);
    expect((await get('/api/couriers/admin', customer)).status).toBe(403);
    expect((await post('/api/couriers/admin', { code: 'ninja', name: 'Ninja' }, customer)).status).toBe(403);
  });

  test('admin menambah kurir: kode dinormalisasi, urutan di akhir, muncul di daftar publik', async () => {
    const res = await post('/api/couriers/admin', { code: ' Ninja ', name: ' Ninja Xpress ' });
    expect(res.status).toBe(201);
    expect(res.body.courier).toMatchObject({ code: 'ninja', name: 'Ninja Xpress', is_active: true, sort_order: 5 });
    expect((await get('/api/couriers')).body.couriers.map(c => c.code)).toContain('ninja');
  });

  test('validasi tambah: kode tidak valid 400, nama pendek 400, kode ganda 409', async () => {
    for (const code of ['', 'a', 'ada spasi', 'ABC-1', 'x'.repeat(31), 123]) {
      expect((await post('/api/couriers/admin', { code, name: 'Valid' })).status).toBe(400);
    }
    expect((await post('/api/couriers/admin', { code: 'abc', name: 'x' })).status).toBe(400);
    expect((await post('/api/couriers/admin', { code: 'jne', name: 'JNE lagi' })).status).toBe(409);
  });

  test('ubah: nama, aktif/nonaktif, urutan; input salah 400; tidak ada 404', async () => {
    const { Courier } = models();
    const jne = await Courier.findOne({ where: { code: 'jne' } });
    const url = `/api/couriers/admin/${jne.courier_id}`;
    expect((await put(url, { is_active: false })).body.courier.is_active).toBe(false);
    expect((await put(url, { name: 'JNE Express', sort_order: 9 })).body.courier).toMatchObject({ name: 'JNE Express', sort_order: 9 });
    expect((await put(url, { is_active: 'ya' })).status).toBe(400);
    expect((await put(url, { name: 'x' })).status).toBe(400);

    // Ubah kode: normalisasi, validasi, duplikat ditolak, kode cod dikunci
    expect((await put(url, { code: ' ANTERAJA ' })).body.courier.code).toBe('anteraja');
    expect((await put(url, { code: 'a b' })).status).toBe(400);
    expect((await put(url, { code: 123 })).status).toBe(400);
    expect((await put(url, { code: 'jnt' })).status).toBe(409);      // sudah dipakai kurir lain
    expect((await put(url, { code: 'cod' })).status).toBe(400);      // tidak boleh jadi cod
    const cod = await Courier.findOne({ where: { code: 'cod' } });
    expect((await put(`/api/couriers/admin/${cod.courier_id}`, { code: 'diantar' })).status).toBe(400);
    expect((await put(`/api/couriers/admin/${cod.courier_id}`, { name: 'COD Toko' })).status).toBe(200); // nama boleh
    expect((await put(url, { sort_order: -1 })).status).toBe(400);
    expect((await put(url, {})).status).toBe(400);
    expect((await put('/api/couriers/admin/99999', { name: 'Abc' })).status).toBe(404);
  });

  test('hapus: berhasil lalu 404; tidak ada 404', async () => {
    const { Courier } = models();
    const sicepat = await Courier.findOne({ where: { code: 'sicepat' } });
    expect((await del(`/api/couriers/admin/${sicepat.courier_id}`)).status).toBe(200);
    expect((await del(`/api/couriers/admin/${sicepat.courier_id}`)).status).toBe(404);
    expect((await get('/api/couriers')).body.couriers.map(c => c.code)).not.toContain('sicepat');
  });

  test('perubahan tercatat di audit log', async () => {
    const res = await post('/api/couriers/admin', { code: 'anteraja', name: 'AnterAja' });
    expect(res.status).toBe(201);
    const { SystemLog } = models();
    const logs = await SystemLog.findAll({ where: { source: 'audit' } });
    expect(logs.some(l => l.metadata?.action === 'create_courier' && l.metadata?.entity_id === res.body.courier.courier_id)).toBe(true);
  });

  test('/shipping/cost menolak kurir nonaktif atau tak dikenal (400), kurir aktif 200', async () => {
    const { Courier } = models();
    const cost = (courier) => post('/api/shipping/cost', { destination: '399', weight: 100, courier }, customer);
    expect((await cost('jne')).status).toBe(200);
    await Courier.update({ is_active: false }, { where: { code: 'jne' } });
    const off = await cost('jne');
    expect(off.status).toBe(400);
    expect(off.body.message).toMatch(/tidak tersedia/i);
    expect((await cost('tidakada')).status).toBe(400);
  });

  test('calculateShipping menolak kurir nonaktif; COD aktif tetap ongkir 0', async () => {
    const { Courier } = models();
    const { calculateShipping, ShippingError } = require('../src/utils/shipping');
    await Courier.update({ is_active: false }, { where: { code: 'jnt' } });
    await expect(calculateShipping({ courier: 'jnt', courierService: 'EZ', address: { city_id: '399' }, weight: 100 }))
      .rejects.toBeInstanceOf(ShippingError);
    expect(await calculateShipping({ courier: 'cod', address: null, weight: 100 })).toEqual({ courier: 'cod', service: 'COD', cost: 0 });
    await Courier.update({ is_active: false }, { where: { code: 'cod' } });
    await expect(calculateShipping({ courier: 'cod', address: null, weight: 100 })).rejects.toThrow(/tidak tersedia/);
  });
});
