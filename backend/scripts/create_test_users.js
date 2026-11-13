// Buat N akun pelanggan uji + 1 akun admin uji. Idempoten (akun yang sudah ada dilewati).
//   ALLOW_LOADTEST_DATA=true LOAD_PASSWORD=... [LOAD_USERS=1100] node scripts/create_test_users.js
const { guard, intEnv, emailOf, ADMIN_EMAIL } = require('./_loadtestGuard');
guard();

const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/database');
const User = require('../src/modules/auth/user.model');
const Cart = require('../src/modules/cart/cart.model');

(async () => {
  const pwd = process.env.LOAD_PASSWORD;
  if (!pwd || pwd.length < 8) {
    console.error('Dibatalkan: LOAD_PASSWORD wajib diisi di environment (minimal 8 karakter).');
    process.exit(1);
  }
  const n = intEnv('LOAD_USERS', 1100);
  try {
    await sequelize.authenticate();
    const hash = await bcrypt.hash(pwd, 8); // cost rendah, hanya data uji
    const rows = [{ full_name: 'Load Admin', email: ADMIN_EMAIL, role: 'admin' }];
    for (let i = 1; i <= n; i++) {
      rows.push({ full_name: `Load User ${i}`, email: emailOf(i), role: 'customer', phone: `0812${String(i).padStart(8, '0')}` });
    }
    const data = rows.map(r => ({ ...r, password: hash, is_verified: true, is_active: true }));

    const CHUNK = 200;
    for (let i = 0; i < data.length; i += CHUNK) {
      await User.bulkCreate(data.slice(i, i + CHUNK), { ignoreDuplicates: true });
    }
    const users = await User.findAll({ where: { email: data.map(d => d.email) }, attributes: ['user_id'] });
    const carts = await Cart.findAll({ where: { user_id: users.map(u => u.user_id) }, attributes: ['user_id'] });
    const have = new Set(carts.map(c => c.user_id));
    const missing = users.filter(u => !have.has(u.user_id)).map(u => ({ user_id: u.user_id }));
    for (let i = 0; i < missing.length; i += CHUNK) {
      await Cart.bulkCreate(missing.slice(i, i + CHUNK));
    }
    console.log(`Selesai: ${n} akun pelanggan + 1 admin uji (domain loadtest.decanttemcy.test), ${missing.length} keranjang baru.`);
  } catch (e) {
    console.error('Gagal:', e.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
