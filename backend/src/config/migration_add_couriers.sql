-- Pengaturan kurir pengiriman (admin bisa tambah, hapus, aktif/nonaktifkan).
-- Catatan: server juga membuat tabel ini otomatis saat start (app.js, sama seperti tabel stores).
-- File ini cadangan bila ingin dijalankan manual lewat pgAdmin: Query Tool -> tempel -> Execute (F5).
-- Aman dijalankan berulang (IF NOT EXISTS / ON CONFLICT DO NOTHING).
CREATE TABLE IF NOT EXISTS couriers (
  courier_id SERIAL PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(60) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO couriers (code, name, sort_order) VALUES
  ('jne', 'JNE', 1),
  ('jnt', 'J&T Express', 2),
  ('sicepat', 'SiCepat', 3),
  ('cod', 'COD (diantar owner)', 4)
ON CONFLICT (code) DO NOTHING;
