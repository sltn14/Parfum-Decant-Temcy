# Koleksi Postman Decant Temcy

Berkas:
- `decant-temcy.postman_collection.json`: 10 folder (Auth, Products, Cart, Orders, Vouchers, Stores, Admin, Sysadmin, Notifications, Chatbot), 49 request. Setiap request punya `pm.test` untuk kode status dan satu field kunci respons.
- `decant-temcy.postman_environment.json`: variabel `base_url`, `token_customer`, `token_admin`, `token_sysadmin`, `product_id`, `order_id`, plus `email_*` / `password_*` untuk tiga role. Nilai rahasia dikosongkan.

## Persiapan
1. Siapkan backend dan database yang berisi data uji. Cara termudah: jalankan `backend/scripts/seed_demo.js` (lihat `backend/scripts/README_seed_demo.md`) ke database demo.
2. Import kedua berkas ke Postman, pilih environment **Decant Temcy - Lokal**.
3. Isi `email_*` dan `password_*` dengan akun customer, admin, dan sysadmin dari data demo. Jangan memasukkan kredensial produksi.
4. Ubah `base_url` bila backend tidak di `http://localhost:5000`.

## Menjalankan
- **Postman Runner:** klik kanan koleksi, **Run collection**, biarkan urutan folder apa adanya (Auth dulu karena mengisi `token_*`, lalu Products mengisi `product_id`, Orders mengisi `order_id`).
- **newman (CLI):**
  ```
  npx newman run docs/postman/decant-temcy.postman_collection.json \
    -e docs/postman/decant-temcy.postman_environment.json \
    --reporters cli,htmlextra,json --reporter-json-export hasil-newman.json
  ```
  (`htmlextra` perlu `npm i -g newman-reporter-htmlextra`; tanpa itu pakai `--reporters cli,json`.)

## Mengekspor hasil sebagai bukti
- Runner: setelah selesai, klik **Export Results** dan simpan JSON-nya, lalu ambil tangkapan layar ringkasan lulus/gagal.
- newman: simpan `hasil-newman.json` (dan laporan HTML bila memakai htmlextra).

## Kasus negatif yang tercakup
Tanpa token (401), role salah (403), password salah (401), voucher kode kosong (400) dan kode tidak dikenal (404), status pesanan tidak valid (400), ukuran vial tidak valid (400), stok kurang (400, `quantity` 99999 pada keranjang), pesan chatbot kosong/terlalu panjang (400), pembuatan akun admin tanpa konfirmasi sandi sysadmin (400).

## Catatan
- Voucher tidak dikenal dijawab **404** oleh API (bukan 400). Kode kosong yang dijawab 400.
- Stok kurang dicek saat menambah ke keranjang, jadi folder Cart yang menguji kasusnya.
- Checkout pickup dan "Update status tidak valid" butuh produk berstok di database demo. Koleksi ini **belum dijalankan** terhadap server sungguhan; jalankan sekali di data demo dan laporkan bila ada tes yang gagal.
- Chatbot tidak dipanggil dengan pesan valid supaya tidak memakai kuota Gemini.
