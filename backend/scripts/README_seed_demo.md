# Seed data demo

`seed_demo.js` mengisi database **demo** untuk tangkapan layar (2.2), video (2.3), dan koleksi Postman.

## Pengaman
Skrip berhenti dengan pesan jelas bila salah satu syarat ini tidak terpenuhi:
- `ALLOW_DEMO_SEED=true` ada di environment.
- Nama database (`DB_NAME`) mengandung kata `demo` atau `test`. Database utama tidak akan pernah disentuh.
- `DEMO_PASSWORD` terisi (minimal 8 karakter). Sandi tidak ditulis di kode dan tidak dicetak.

## Cara pakai
1. Buat database kosong, misalnya `decant_temcy_demo`, lalu buat tabelnya (jalankan SQL skema yang sama seperti database utama di pgAdmin).
2. Jalankan (sesuaikan nilainya; `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` ikut `.env` biasa):
   ```
   cd backend
   ALLOW_DEMO_SEED=true DB_NAME=decant_temcy_demo DEMO_PASSWORD='SandiDemo123' npm run seed:demo
   ```
   Windows PowerShell:
   ```
   $env:ALLOW_DEMO_SEED="true"; $env:DB_NAME="decant_temcy_demo"; $env:DEMO_PASSWORD="SandiDemo123"; npm run seed:demo
   ```
3. Jalankan backend ke database yang sama (`DB_NAME=decant_temcy_demo npm start`) lalu login dengan akun yang dicetak di akhir.

Aman dijalankan berulang: data yang sudah ada dilewati, lalu stok vial, `sold_count`, dan `used_count` voucher dihitung ulang dari seluruh pesanan demo.

## Isi data
| Jenis | Isi |
|---|---|
| Akun | sysadmin@, admin@, customer1@ s.d. customer3@ `demo.decanttemcy.test` (sandi = `DEMO_PASSWORD`) |
| Produk | 4 produk "Demo Atelier", masing-masing 20 vial per ukuran (1/2/3/5 ml) sebelum pesanan |
| Cabang | Demo Store Semarang, Demo Store Jakarta |
| Voucher | `DEMO10` (aktif, 10% maks 20.000), `DEMOEXPIRED` (kedaluwarsa), `DEMOHABIS` (kuota 1, sudah terpakai) |
| Pesanan | kode `DEMO-PENDING`, `DEMO-PAID`, `DEMO-PROCESSING`, `DEMO-SHIPPED`, `DEMO-DELIVERED`, `DEMO-DELIVERED2`, `DEMO-CANCELLED` |
| Lainnya | notifikasi tiap pesanan + promo, tracking untuk pesanan shipped/delivered, ulasan dan favorit untuk pesanan delivered |

Konsistensi: pesanan `cancelled` tidak mengurangi stok dan tidak memakai kuota voucher. Total tiap pesanan = subtotal - diskon + ongkir (pickup = 0).

## Catatan
- Skrip ini **belum dijalankan** terhadap PostgreSQL di lingkungan penyusun (tidak ada database di sana); hanya pengaman di atas yang sudah diuji. Jalankan sekali dan laporkan bila ada error.
- Membersihkan data demo: hapus dan buat ulang database demo.
