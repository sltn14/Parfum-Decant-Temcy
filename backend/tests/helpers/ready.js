// Menentukan apakah tes yang butuh database boleh jalan. Bila tidak, tes DIMELEWATI (skip)
// dengan alasan yang jelas, bukan gagal.
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const schemaPath = path.join(__dirname, '..', 'schema.sql');

const check = () => {
  const name = process.env.DB_NAME_TEST;
  if (!name) return 'DB_NAME_TEST belum diset di backend/.env';
  // Pengaman: tes menghapus seluruh isi database, jadi namanya wajib mengandung "test"
  if (!/test/i.test(name)) return `DB_NAME_TEST ("${name}") harus mengandung kata "test" agar tidak menghapus database utama`;
  if (name === process.env.DB_NAME) return 'DB_NAME_TEST tidak boleh sama dengan DB_NAME (database utama)';
  if (!fs.existsSync(schemaPath)) return 'backend/tests/schema.sql tidak ada (buat dengan pg_dump --schema-only dari database utama)';
  return null;
};

const reason = check();
module.exports = { ready: !reason, reason, schemaPath };
