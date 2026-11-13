const request = require('supertest');
const { describeDb, resetDb, closeDb, createUser, authHeader } = require('./helpers/db');

describeDb('POST /api/shipping/cost: wajib login dan dibatasi laju', () => {
  let app, user;
  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => { await resetDb(); user = await createUser(); });
  afterAll(closeDb);

  // Pembatas laju menyimpan hitungan per proses, jadi jatah yang sudah dipakai tes sebelumnya
  // harus ikut dihitung. Hanya permintaan yang lolos authenticate yang masuk hitungan.
  const LIMIT = 60;
  let used = 0;
  const cost = (headers = {}) => {
    if (headers.Authorization) used += 1;
    return request(app).post('/api/shipping/cost').set(headers).send({ destination: '399', weight: 100, courier: 'jne' });
  };

  test('tanpa login 401', async () => {
    expect((await cost()).status).toBe(401);
  });

  test('dengan login 200 dan daftar layanan (RajaOngkir mode mock)', async () => {
    const res = await cost(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.costs.length).toBeGreaterThan(0);
  });

  test('permintaan ke-61 dalam 15 menit mendapat 429', async () => {
    const h = authHeader(user);
    const remaining = LIMIT - used;
    for (let i = 0; i < remaining; i++) expect((await cost(h)).status).toBe(200);
    expect((await cost(h)).status).toBe(429);
  });
});