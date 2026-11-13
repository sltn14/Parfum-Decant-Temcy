const request = require('supertest');
const { describeDb, resetDb, closeDb, createUser, authHeader } = require('./helpers/db');

describeDb('GET /api/shipping/destinations: pencarian lokasi untuk form alamat', () => {
  let app, user;
  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => { await resetDb(); user = await createUser(); });
  afterAll(closeDb);

  test('tanpa login 401', async () => {
    expect((await request(app).get('/api/shipping/destinations?search=semarang')).status).toBe(401);
  });

  test('kata pencarian kurang dari 3 huruf 400', async () => {
    const res = await request(app).get('/api/shipping/destinations?search=se').set(authHeader(user));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/minimal 3 huruf/);
  });

  test('dengan login 200 dan daftar lokasi (mode mock)', async () => {
    const res = await request(app).get('/api/shipping/destinations?search=semarang').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.destinations.length).toBeGreaterThan(0);
    expect(res.body.destinations[0]).toHaveProperty('id');
    expect(res.body.destinations[0]).toHaveProperty('label');
  });
});
