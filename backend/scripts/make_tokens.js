// Hasilkan tokens.csv (email,token,role) untuk JMeter CSV Data Set Config.
// Token dibuat langsung dengan JWT_SECRET lingkungan uji (tanpa memanggil /login,
// jadi tidak kena batas 20 percobaan/15 menit). Payload sama dengan login asli: {user_id, role}.
//   ALLOW_LOADTEST_DATA=true [LOAD_TOKEN_TTL=4h] [LOAD_TOKENS_OUT=tokens.csv] node scripts/make_tokens.js
const { guard, EMAIL_DOMAIN } = require('./_loadtestGuard');
guard();

const fs = require('fs');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const sequelize = require('../src/config/database');
const User = require('../src/modules/auth/user.model');

(async () => {
  if (!process.env.JWT_SECRET) {
    console.error('Dibatalkan: JWT_SECRET tidak ada di environment.');
    process.exit(1);
  }
  const ttl = process.env.LOAD_TOKEN_TTL || '4h';
  const out = process.env.LOAD_TOKENS_OUT || 'tokens.csv';
  try {
    const users = await User.findAll({
      where: { email: { [Op.like]: `%@${EMAIL_DOMAIN}` }, is_active: true },
      attributes: ['user_id', 'email', 'role'],
      order: [['user_id', 'ASC']]
    });
    const lines = ['email,token,role'];
    for (const u of users) {
      const token = jwt.sign({ user_id: u.user_id, role: u.role }, process.env.JWT_SECRET, { expiresIn: ttl });
      lines.push(`${u.email},${token},${u.role}`);
    }
    fs.writeFileSync(out, lines.join('\n') + '\n');
    console.log(`Selesai: ${users.length} token ditulis ke ${out} (berlaku ${ttl}). Jangan di-commit.`);
  } catch (e) {
    console.error('Gagal:', e.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
