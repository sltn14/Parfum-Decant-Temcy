const request = require('supertest');
const bcrypt = require('bcryptjs');
const { describeDb, models, resetDb, closeDb, createUser, authHeader } = require('./helpers/db');

describeDb('Ganti password', () => {
  let app;
  const OLD = 'Passw0rd!x';
  const put = (user, body) => request(app).put('/api/users/change-password').set(authHeader(user)).send(body);

  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(resetDb);
  afterAll(closeDb);

  test('berhasil dengan current_password; password di DB berubah', async () => {
    const user = await createUser();
    const res = await put(user, { current_password: OLD, new_password: 'BaruLagi123' });
    expect(res.status).toBe(200);
    const fresh = await models().User.findByPk(user.user_id);
    expect(await bcrypt.compare('BaruLagi123', fresh.password)).toBe(true);
  });

  test('old_password (frontend lama) tetap diterima', async () => {
    const user = await createUser();
    expect((await put(user, { old_password: OLD, new_password: 'BaruLagi123' })).status).toBe(200);
  });

  test('password lama salah: 400, password tidak berubah', async () => {
    const user = await createUser();
    const res = await put(user, { current_password: 'salah-banget', new_password: 'BaruLagi123' });
    expect(res.status).toBe(400);
    const fresh = await models().User.findByPk(user.user_id);
    expect(await bcrypt.compare(OLD, fresh.password)).toBe(true);
  });

  test('password baru kurang dari 8 karakter: 400', async () => {
    const user = await createUser();
    expect((await put(user, { current_password: OLD, new_password: 'short1' })).status).toBe(400);
  });

  test('password baru sama dengan yang lama: 400', async () => {
    const user = await createUser();
    const res = await put(user, { current_password: OLD, new_password: OLD });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/berbeda/);
  });

  test('field kosong atau bukan string: 400 (bukan 500)', async () => {
    const user = await createUser();
    expect((await put(user, {})).status).toBe(400);
    expect((await put(user, { current_password: OLD })).status).toBe(400);
    expect((await put(user, { current_password: { a: 1 }, new_password: 'BaruLagi123' })).status).toBe(400);
    expect((await put(user, { current_password: OLD, new_password: 12345678 })).status).toBe(400);
  });

  test('akun Google (password null): 400 dengan pesan khusus, bukan 500', async () => {
    const user = await createUser('customer', { password: null });
    const res = await put(user, { current_password: 'apa-saja', new_password: 'BaruLagi123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Akun ini terdaftar via Google, gunakan fitur lupa password');
  });

  test('tanpa login: 401', async () => {
    expect((await request(app).put('/api/users/change-password').send({})).status).toBe(401);
  });
});
