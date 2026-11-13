const request = require('supertest');
const { describeDb, resetDb, closeDb, createUser, authHeader, createProduct } = require('./helpers/db');

describeDb('Akses per role (RBAC)', () => {
  let app, customer, admin, sysadmin;
  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    customer = await createUser('customer');
    admin = await createUser('admin');
    sysadmin = await createUser('sysadmin');
  });
  afterAll(closeDb);

  test('tanpa token: 401 untuk rute terlindungi', async () => {
    expect((await request(app).get('/api/cart')).status).toBe(401);
    expect((await request(app).get('/api/admin/dashboard')).status).toBe(401);
    expect((await request(app).get('/api/sysadmin/config')).status).toBe(401);
  });

  test('customer: 403 di rute admin dan sysadmin', async () => {
    expect((await request(app).get('/api/admin/dashboard').set(authHeader(customer))).status).toBe(403);
    expect((await request(app).post('/api/products').set(authHeader(customer)).send({ brand: 'x', product_name: 'y' })).status).toBe(403);
    expect((await request(app).get('/api/orders/admin/all').set(authHeader(customer))).status).toBe(403);
    expect((await request(app).get('/api/sysadmin/config').set(authHeader(customer))).status).toBe(403);
  });

  test('admin: boleh di rute admin, 403 di rute sysadmin', async () => {
    expect((await request(app).get('/api/admin/dashboard').set(authHeader(admin))).status).toBe(200);
    expect((await request(app).get('/api/sysadmin/config').set(authHeader(admin))).status).toBe(403);
    expect((await request(app).get('/api/sysadmin/users').set(authHeader(admin))).status).toBe(403);
  });

  test('sysadmin: boleh di rute sysadmin', async () => {
    expect((await request(app).get('/api/sysadmin/config').set(authHeader(sysadmin))).status).toBe(200);
  });

  test('endpoint pengelolaan akun lama /api/admin/users sudah tidak ada', async () => {
    expect((await request(app).get('/api/admin/users').set(authHeader(admin))).status).toBe(404);
    expect((await request(app).post('/api/admin/users').set(authHeader(admin)).send({})).status).toBe(404);
  });

  test('admin tidak bisa membuat akun admin lewat sysadmin API, sysadmin wajib konfirmasi sandi', async () => {
    const body = { full_name: 'A', email: 'a2@test.local', password: 'Passw0rd!x', role: 'admin' };
    expect((await request(app).post('/api/sysadmin/users').set(authHeader(admin)).send(body)).status).toBe(403);
    const noPass = await request(app).post('/api/sysadmin/users').set(authHeader(sysadmin)).send(body);
    expect(noPass.status).toBe(400);
    const wrong = await request(app).post('/api/sysadmin/users').set(authHeader(sysadmin)).send({ ...body, sysadmin_password: 'salah' });
    expect(wrong.status).toBe(401);
    const ok = await request(app).post('/api/sysadmin/users').set(authHeader(sysadmin)).send({ ...body, sysadmin_password: 'Passw0rd!x' });
    expect(ok.status).toBe(201);
  });

  test('daftar produk publik bisa diakses tanpa login', async () => {
    await createProduct();
    expect((await request(app).get('/api/products')).status).toBe(200);
  });
});
