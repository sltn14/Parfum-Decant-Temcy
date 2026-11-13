const express = require('express');
const request = require('supertest');
const { rateLimit } = require('../src/middleware/rateLimit.middleware');
const { describeDb, resetDb, closeDb } = require('./helpers/db');

// Unit: tidak butuh database, selalu dijalankan
describe('rateLimit middleware', () => {
  const makeApp = (max) => {
    const app = express();
    app.get('/x', rateLimit({ windowMs: 60000, max, message: 'terlalu banyak' }), (req, res) => res.json({ ok: true }));
    return app;
  };

  test('permintaan melebihi batas mendapat 429 dengan Retry-After', async () => {
    const app = makeApp(2);
    expect((await request(app).get('/x')).status).toBe(200);
    expect((await request(app).get('/x')).status).toBe(200);
    const third = await request(app).get('/x');
    expect(third.status).toBe(429);
    expect(third.body.message).toBe('terlalu banyak');
    expect(Number(third.headers['retry-after'])).toBeGreaterThan(0);
  });

  test('batas dihitung per rute dan per instance limiter', async () => {
    const app = makeApp(1);
    expect((await request(app).get('/x')).status).toBe(200);
    expect((await request(app).get('/x')).status).toBe(429);
    const other = makeApp(1);
    expect((await request(other).get('/x')).status).toBe(200);
  });
});

// Integrasi: login dibatasi 20 percobaan per 15 menit
describeDb('Rate limit pada /api/auth/login', () => {
  let app;
  beforeAll(() => { ({ app } = require('../src/app')); });
  beforeEach(resetDb);
  afterAll(closeDb);

  test('percobaan ke-21 mendapat 429', async () => {
    const attempt = () => request(app).post('/api/auth/login').send({ email: 'x@test.local', password: 'salah-banget' });
    for (let i = 0; i < 20; i++) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });
});
