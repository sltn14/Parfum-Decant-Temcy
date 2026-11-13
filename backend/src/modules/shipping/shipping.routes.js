const express = require('express');
const router = express.Router();
const { provinces, cities, cost, destinations } = require('./shipping.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { rateLimit } = require('../../middleware/rateLimit.middleware');

// Hitung ongkir memanggil API RajaOngkir (kuota terbatas): wajib login dan dibatasi lajunya.
// Checkout sendiri menghitung ongkir ulang di server, jadi endpoint ini hanya untuk tampilan pilihan layanan.
const costLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, message: 'Terlalu banyak permintaan ongkir, coba lagi nanti' });

// Pencarian destinasi memakai kuota RajaOngkir juga (hasilnya di-cache di server): wajib login dan dibatasi
const destLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 120, message: 'Terlalu banyak pencarian lokasi, coba lagi nanti' });

router.get('/destinations', authenticate, destLimiter, destinations);
router.get('/provinces', provinces);
router.get('/cities/:provinceId', cities);
router.post('/cost', authenticate, costLimiter, cost);

module.exports = router;