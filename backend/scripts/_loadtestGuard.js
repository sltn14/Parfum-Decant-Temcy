// Pengaman bersama untuk skrip data uji beban. JANGAN dihapus.
// Skrip hanya jalan bila DB_NAME memuat "test"/"demo" DAN ALLOW_LOADTEST_DATA=true.
require('dotenv').config();

const guard = () => {
  const dbName = String(process.env.DB_NAME || '');
  if (process.env.ALLOW_LOADTEST_DATA !== 'true') {
    console.error('Dibatalkan: set ALLOW_LOADTEST_DATA=true untuk menjalankan skrip data uji beban.');
    process.exit(1);
  }
  if (!/demo|test/i.test(dbName)) {
    console.error(`Dibatalkan: nama database "${dbName}" tidak mengandung "test" atau "demo". Skrip ini tidak boleh menyentuh database utama.`);
    process.exit(1);
  }
};

const intEnv = (name, def) => {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) && v > 0 ? v : def;
};

const EMAIL_DOMAIN = 'loadtest.decanttemcy.test';
const emailOf = (i) => `loaduser${String(i).padStart(5, '0')}@${EMAIL_DOMAIN}`;
const ADMIN_EMAIL = `loadadmin@${EMAIL_DOMAIN}`;

module.exports = { guard, intEnv, EMAIL_DOMAIN, emailOf, ADMIN_EMAIL };
