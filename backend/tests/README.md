# Tes backend (Jest + supertest)

Status: **ditulis tetapi belum pernah dijalankan** (sandbox penulis tidak punya PostgreSQL dan npm). Jalankan di mesinmu dan periksa hasilnya.

## Persiapan
1. Pasang dependensi uji: `npm install -D jest supertest autocannon` (di folder `backend`).
2. Ekspor skema dari database utama **tanpa data**, simpan sebagai `backend/tests/schema.sql`:
   `pg_dump -U <user> -d <db_utama> --schema-only --no-owner -f backend/tests/schema.sql`
   (atau pgAdmin: klik kanan database > Backup > Format Plain > centang *Only schema*).
3. Buat database uji kosong, namanya WAJIB mengandung kata `test`, mis. `decant_temcy_test`, lalu isi di `backend/.env`:
   `DB_NAME_TEST=decant_temcy_test`
   Seluruh isi database ini DIHAPUS dan dibuat ulang setiap `npm test` (`DROP SCHEMA public CASCADE`).
4. Jalankan: `npm test` (sudah memakai `--runInBand` karena semua tes berbagi satu database).

## Bila prasyarat belum ada
Tes yang butuh database otomatis **dilewati (skip)** dengan alasan yang jelas, bukan gagal (mis. `schema.sql` belum ada, `DB_NAME_TEST` kosong, atau namanya tidak mengandung "test"). Tes `ratelimit` bagian unit tetap jalan tanpa database.

## Yang diuji
| Berkas | Isi |
|---|---|
| `auth.test.js` | register (sukses, email ganda, format, password pendek), login (sukses, salah, nonaktif) |
| `checkout.test.js` | stok berkurang, stok kurang ditolak, voucher tidak valid ditolak (rollback), voucher valid, dua checkout bersamaan untuk kuota terakhir |
| `status.test.js` | transisi status valid dan tidak valid, status final |
| `cancel.test.js` | stok dan voucher kembali tepat sekali (pelanggan, admin, pembatalan ganda, dua pembatalan bersamaan) |
| `webhook.test.js` | signature benar/salah, settlement ganda, expire/deny ganda, expire setelah paid |
| `whitelist.test.js` | produk, voucher, alamat tidak menerima field terlarang |
| `ratelimit.test.js` | middleware (unit) dan login 429 setelah 20 percobaan |
| `rbac.test.js` | 401/403 per role, endpoint `/api/admin/users` sudah tidak ada, konfirmasi sandi sysadmin |
| `chatbot.test.js` | batas 1000/4000 karakter dan validasi (Gemini di-mock) |

Midtrans, SMTP (nodemailer), dan Gemini di-mock di `tests/helpers/mocks.js`.

## Belum tercakup
Timeout Gemini 15 detik (butuh fake timer), Google OAuth, dan pengiriman email sungguhan.
