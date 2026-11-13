const request = require('supertest');
const { describeDb, resetDb, closeDb, createUser } = require('./helpers/db');

describeDb('Autentikasi: register dan login', () => {
  let app;
  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(resetDb);
  afterAll(closeDb);

  test('register berhasil lalu login mengembalikan token', async () => {
    const reg = await request(app).post('/api/auth/register')
      .send({ full_name: 'Budi', email: 'budi@test.local', password: 'Passw0rd!x' });
    expect(reg.status).toBe(201);
    expect(reg.body.user.role).toBe('customer');

    const login = await request(app).post('/api/auth/login')
      .send({ email: 'budi@test.local', password: 'Passw0rd!x' });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();
  });

  test('register menolak email ganda, email salah format, dan password pendek', async () => {
    await createUser('customer', { email: 'dup@test.local' });
    const dup = await request(app).post('/api/auth/register')
      .send({ full_name: 'X', email: 'dup@test.local', password: 'Passw0rd!x' });
    expect(dup.status).toBe(400);
    const bad = await request(app).post('/api/auth/register')
      .send({ full_name: 'X', email: 'bukan-email', password: 'Passw0rd!x' });
    expect(bad.status).toBe(400);
    const short = await request(app).post('/api/auth/register')
      .send({ full_name: 'X', email: 'ok@test.local', password: 'pendek' });
    expect(short.status).toBe(400);
  });

  test('login ditolak untuk password salah dan akun nonaktif', async () => {
    await createUser('customer', { email: 'a@test.local' });
    const wrong = await request(app).post('/api/auth/login').send({ email: 'a@test.local', password: 'salah-banget' });
    expect(wrong.status).toBe(401);
    await createUser('customer', { email: 'off@test.local', is_active: false });
    const off = await request(app).post('/api/auth/login').send({ email: 'off@test.local', password: 'Passw0rd!x' });
    expect(off.status).toBe(401);
  });
});
