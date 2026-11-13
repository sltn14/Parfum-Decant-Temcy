const request = require('supertest');
const { describeDb, resetDb, closeDb, createUser, authHeader } = require('./helpers/db');

describeDb('Chatbot: validasi pesan (Gemini di-mock)', () => {
  let app, customer, admin;
  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'kunci-palsu';
    ({ app } = require('../src/app'));
  });
  beforeEach(async () => {
    await resetDb();
    customer = await createUser();
    admin = await createUser('admin');
  });
  afterAll(async () => { delete process.env.GEMINI_API_KEY; await closeDb(); });

  const send = (u, message, session_id = 's1') =>
    request(app).post('/api/chatbot').set(authHeader(u)).send({ message, session_id });

  test('butuh login', async () => {
    expect((await request(app).post('/api/chatbot').send({ message: 'halo', session_id: 's' })).status).toBe(401);
  });

  test('pesan 1000 karakter diterima, 1001 ditolak 400 untuk customer', async () => {
    expect((await send(customer, 'a'.repeat(1000))).status).toBe(200);
    expect((await send(customer, 'a'.repeat(1001))).status).toBe(400);
  });

  test('admin boleh sampai 4000 karakter (prompt AI Insight)', async () => {
    expect((await send(admin, 'a'.repeat(3000))).status).toBe(200);
    expect((await send(admin, 'a'.repeat(4001))).status).toBe(400);
  });

  test('pesan kosong dan session_id kosong ditolak', async () => {
    expect((await send(customer, '   ')).status).toBe(400);
    expect((await request(app).post('/api/chatbot').set(authHeader(customer)).send({ message: 'halo' })).status).toBe(400);
  });
});
