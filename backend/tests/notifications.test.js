const request = require('supertest');
const { describeDb, models, resetDb, closeDb, createUser, authHeader, createProduct, createStore, placeOrder } = require('./helpers/db');

describeDb('Notifikasi: tautan ke pesanan dan tandai dibaca', () => {
  let app, user, other, admin, order;
  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(async () => {
    await resetDb();
    await createStore();
    user = await createUser();
    other = await createUser();
    admin = await createUser('admin');
    const product = await createProduct();
    order = await placeOrder(app, user, product, { qty: 1 });
  });
  afterAll(closeDb);

  const list = (u) => request(app).get('/api/notifications').set(authHeader(u));

  test('perubahan status membuat notifikasi dengan link ke detail pesanan', async () => {
    const res = await request(app).put(`/api/orders/${order.order_id}/status`).set(authHeader(admin)).send({ status: 'paid' });
    expect(res.status).toBe(200);
    const notifs = (await list(user)).body.notifications;
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs[0].link).toBe(`/orders/${order.order_id}`);
    expect(notifs[0].is_read).toBe(false);
  });

  test('tandai satu dibaca: hanya milik sendiri, id tidak valid 400, tidak ada 404', async () => {
    await request(app).put(`/api/orders/${order.order_id}/status`).set(authHeader(admin)).send({ status: 'paid' });
    const id = (await list(user)).body.notifications[0].notification_id;

    expect((await request(app).put(`/api/notifications/${id}/read`).set(authHeader(other))).status).toBe(404);
    expect((await list(user)).body.notifications[0].is_read).toBe(false); // tidak berubah oleh pengguna lain

    expect((await request(app).put(`/api/notifications/${id}/read`).set(authHeader(user))).status).toBe(200);
    expect((await list(user)).body.notifications[0].is_read).toBe(true);
    // dipanggil dua kali tetap 200 (idempoten)
    expect((await request(app).put(`/api/notifications/${id}/read`).set(authHeader(user))).status).toBe(200);

    expect((await request(app).put('/api/notifications/abc/read').set(authHeader(user))).status).toBe(400);
    expect((await request(app).put('/api/notifications/99999/read').set(authHeader(user))).status).toBe(404);
  });

  test('tandai semua dibaca hanya memengaruhi notifikasi milik sendiri', async () => {
    const { Notification } = models();
    await Notification.bulkCreate([
      { user_id: user.user_id, title: 'A', message: 'a', type: 'order' },
      { user_id: user.user_id, title: 'B', message: 'b', type: 'system' },
      { user_id: other.user_id, title: 'C', message: 'c', type: 'system' }
    ]);
    const res = await request(app).put('/api/notifications/read-all').set(authHeader(user));
    expect(res.status).toBe(200);
    expect((await list(user)).body.notifications.every(n => n.is_read)).toBe(true);
    expect((await list(other)).body.notifications.every(n => !n.is_read)).toBe(true);
  });
});
