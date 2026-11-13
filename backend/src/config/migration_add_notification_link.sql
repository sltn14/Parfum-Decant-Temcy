-- Notifikasi bisa diklik untuk membuka halaman terkait (mis. /orders/12).
-- Cara pakai (pgAdmin): backup dulu -> klik kanan database -> Query Tool -> paste -> Execute (F5).
-- Aman dijalankan berulang. Notifikasi lama tetap jalan (link kosong -> membuka daftar pesanan).

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(255);
