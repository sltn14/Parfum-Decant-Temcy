-- Tambah ukuran 10 ml. Stok sekarang berbasis ml botol besar (products.stock_ml),
-- jadi TIDAK ada kolom stock_10ml. Kolom stock_1ml..stock_5ml lama dibiarkan (tidak dipakai lagi).
--
-- Cara pakai (pgAdmin): backup dulu -> klik kanan database -> Query Tool -> paste file ini -> Execute (F5).
-- Aman dijalankan berulang.

ALTER TABLE products ADD COLUMN IF NOT EXISTS price_10ml INTEGER;

-- Opsional: isi harga 10 ml sementara dari harga 5 ml x 2 (dikurangi ~10%). SESUAIKAN lagi lewat halaman admin Produk.
-- UPDATE products SET price_10ml = ROUND(price_5ml * 2 * 0.9, -2) WHERE price_10ml IS NULL AND price_5ml > 0;

-- Samakan stock_ml dengan total vial lama SEKALI SAJA kalau belum pernah menjalankan migration_sync_stock_ml.sql:
-- UPDATE products SET stock_ml = COALESCE(stock_1ml,0) + 2*COALESCE(stock_2ml,0) + 3*COALESCE(stock_3ml,0) + 5*COALESCE(stock_5ml,0);
