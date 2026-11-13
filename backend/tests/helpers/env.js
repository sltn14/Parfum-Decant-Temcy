// Dijalankan Jest sebelum tiap berkas tes: arahkan aplikasi ke database uji dan isi rahasia palsu.
const { ready } = require('./ready');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
process.env.MIDTRANS_SERVER_KEY = 'test-midtrans-server-key';
process.env.CLIENT_URL = 'http://localhost:5173';
delete process.env.GEMINI_API_KEY;
// Paksa mode mock RajaOngkir (tarif tetap: JNE REG 22000, OKE 15000, ...), jangan memanggil API sungguhan
process.env.RAJAONGKIR_KEY = 'YOUR_API_KEY';

// Hanya alihkan DB bila aman; kalau tidak, tes DB dilewati dan tidak ada koneksi yang dibuka
if (ready) process.env.DB_NAME = process.env.DB_NAME_TEST;
