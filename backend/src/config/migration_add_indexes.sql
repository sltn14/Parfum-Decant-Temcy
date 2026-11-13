-- ============================================================================
-- migration_add_indexes.sql  (T13)
-- Indeks PostgreSQL untuk query yang benar-benar dipakai aplikasi.
-- Aman dijalankan berulang (IF NOT EXISTS). Tidak mengubah data.
--
-- Cara menjalankan di pgAdmin:
--   1. Buka Query Tool pada database utama (klik kanan database > Query Tool).
--   2. Buka file ini (ikon folder) atau tempel isinya, lalu tekan F5.
--   3. Jalankan blok VERIFIKASI di bagian bawah untuk melihat daftar indeks.
--
-- Prinsip: hanya indeks yang didukung query nyata (dirujuk di komentar tiap baris).
-- Tidak ada indeks untuk gender/concentration saja: kardinalitasnya rendah (3 nilai)
-- sehingga planner tetap memilih sequential scan; filter itu ikut terlayani oleh
-- indeks parsial is_active + urutan di bawah.
-- ============================================================================

-- ---------- products ----------
-- GET /products (katalog) selalu is_active = true, lalu ORDER BY sold_count / price_1ml / createdAt.
-- Rekomendasi populer dan "produk serupa" (recommendation.controller.js) juga is_active + sold_count.
CREATE INDEX IF NOT EXISTS idx_products_active_sold
  ON products (sold_count DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON products ("createdAt" DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_active_price
  ON products (price_1ml) WHERE is_active = true;
-- Rekomendasi per konsentrasi: WHERE is_active AND concentration = ? ORDER BY sold_count DESC
CREATE INDEX IF NOT EXISTS idx_products_active_conc_sold
  ON products (concentration, sold_count DESC) WHERE is_active = true;

-- ---------- orders ----------
-- GET /orders/my-orders (paginasi) dan hitung per status: WHERE user_id = ? ORDER BY "createdAt" DESC
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, "createdAt" DESC);
-- Admin: dashboard (GROUP BY status, SUM untuk delivered), daftar pesanan per status, laporan penjualan
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders (status, "createdAt" DESC);
-- (order_code sudah punya indeks unik; dipakai webhook Midtrans)

-- ---------- order_items ----------
-- Hampir semua query pesanan meng-include items: JOIN ... ON order_items.order_id = orders.order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
-- Rekomendasi personal dan cek "sudah pernah beli" (review): JOIN/filter berdasarkan product_id
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);

-- ---------- reviews ----------
-- GET ulasan produk: WHERE product_id = ? AND is_active = true ORDER BY "createdAt" DESC
CREATE INDEX IF NOT EXISTS idx_reviews_product_created
  ON reviews (product_id, "createdAt" DESC) WHERE is_active = true;
-- Cek ulasan ganda: WHERE user_id = ? AND product_id = ?
CREATE INDEX IF NOT EXISTS idx_reviews_user_product ON reviews (user_id, product_id);

-- ---------- favorites ----------
-- Daftar favorit, cek dan toggle: WHERE user_id = ? [AND product_id = ?]
CREATE INDEX IF NOT EXISTS idx_favorites_user_product ON favorites (user_id, product_id);

-- ---------- notifications ----------
-- GET /notifications: WHERE user_id = ? ORDER BY "createdAt" DESC LIMIT n
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, "createdAt" DESC);
-- Tandai dibaca: UPDATE ... WHERE user_id = ? AND is_read = false (indeks kecil: hanya baris belum dibaca)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id) WHERE is_read = false;

-- ---------- carts / cart_items ----------
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts (user_id);
-- Include item keranjang dan cek item yang sama: WHERE cart_id = ? [AND product_id = ? AND size_ml = ?]
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_product_size ON cart_items (cart_id, product_id, size_ml);

-- ---------- system_logs ----------
-- Halaman Monitoring sysadmin: ORDER BY "createdAt" DESC, dengan filter level / source ('audit')
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_source_created ON system_logs (source, "createdAt" DESC);

-- Perbarui statistik agar planner langsung memakai indeks baru
ANALYZE;

-- ---------- VERIFIKASI: daftar indeks yang terbentuk ----------
-- SELECT tablename, indexname FROM pg_indexes
-- WHERE schemaname = 'public' AND indexname LIKE 'idx\_%' ORDER BY tablename, indexname;

-- ---------- BUKTI PEMAKAIAN: contoh EXPLAIN (jalankan satu per satu) ----------
-- Catatan: pada tabel kecil (ratusan baris) planner sering tetap memilih Seq Scan karena
-- memang lebih murah. Untuk membuktikan indeks DAPAT dipakai, matikan seq scan HANYA di sesi ini:
--   SET enable_seqscan = off;   -- ... jalankan EXPLAIN ... ;   RESET enable_seqscan;
--
-- 1) Katalog terlaris. Harapan: Index Scan using idx_products_active_sold
-- EXPLAIN (ANALYZE, BUFFERS)
--   SELECT * FROM products WHERE is_active = true ORDER BY sold_count DESC LIMIT 15;
--
-- 2) Pesanan saya (ganti 1 dengan user_id nyata). Harapan: idx_orders_user_created
-- EXPLAIN (ANALYZE, BUFFERS)
--   SELECT * FROM orders WHERE user_id = 1 ORDER BY "createdAt" DESC LIMIT 10;
--
-- 3) Ulasan produk. Harapan: idx_reviews_product_created
-- EXPLAIN (ANALYZE, BUFFERS)
--   SELECT * FROM reviews WHERE product_id = 1 AND is_active = true ORDER BY "createdAt" DESC;
--
-- 4) Notifikasi. Harapan: idx_notifications_user_created
-- EXPLAIN (ANALYZE, BUFFERS)
--   SELECT * FROM notifications WHERE user_id = 1 ORDER BY "createdAt" DESC LIMIT 50;
--
-- 5) Log audit. Harapan: idx_system_logs_source_created
-- EXPLAIN (ANALYZE, BUFFERS)
--   SELECT * FROM system_logs WHERE source = 'audit' ORDER BY "createdAt" DESC LIMIT 15;

-- ---------- OPSIONAL (tidak dijalankan otomatis): pencarian ILIKE '%kata%' ----------
-- Pencarian katalog memakai iLike '%kata%' pada product_name, brand, main_accords. Indeks B-tree
-- tidak membantu pola awalan-wildcard; yang membantu adalah trigram (GIN). Syarat: ekstensi
-- pg_trgm (butuh hak superuser/owner; di pgAdmin: Extensions > Create). Baru berguna bila
-- jumlah produk sudah ribuan. Hapus tanda komentar jika syarat terpenuhi:
--
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_products_name_trgm  ON products USING gin (product_name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING gin (brand gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_products_accords_trgm ON products USING gin (main_accords gin_trgm_ops);
