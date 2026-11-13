const User = require('../auth/user.model');
const SystemConfig = require('./system_config.model');
const SystemLog = require('./system_log.model');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const os = require('os');
const { getAI, generateText } = require('../chatbot/chatbot.controller');
const { getConfig } = require('../../utils/systemConfig');
const { writeLog, audit, pickKeys, changes } = require('../../utils/audit');
const passport = require('../../config/passport');

// Batas waktu cek koneksi supaya tombol TEST di panel tidak menggantung
const CHECK_TIMEOUT_MS = 10000;
const SMTP_TIMEOUTS = { connectionTimeout: CHECK_TIMEOUT_MS, greetingTimeout: CHECK_TIMEOUT_MS, socketTimeout: CHECK_TIMEOUT_MS };

// Helper: cek koneksi ke Gemini lewat jalur yang sama dengan chatbot (model utama + cadangan,
// mode API sama). Tanpa tools/pencarian supaya tidak ada biaya tambahan. Throw bila semua gagal.
const pingGemini = async () => {
  const ai = await getAI();
  await generateText(ai, { prompt: 'ping', maxOutputTokens: 64, timeoutMs: CHECK_TIMEOUT_MS });
};

// Penulisan log memakai helper bersama (utils/audit.js)
const saveLog = writeLog;

// ===== MONITORING =====
// Cek SMTP/Gemini membuka koneksi sungguhan, jadi hasilnya di-cache beberapa menit
// agar polling dashboard tidak terus memanggil layanan eksternal (?force=1 melewati cache).
const EXTERNAL_CHECK_TTL_MS = 3 * 60 * 1000;
let externalCheckCache = { at: 0, smtp: 'unknown', ai: 'unknown' };

const checkExternalServices = async (force = false) => {
  if (!force && Date.now() - externalCheckCache.at < EXTERNAL_CHECK_TTL_MS) return externalCheckCache;

  let smtp = 'unknown';
  try {
    const transporter = nodemailer.createTransport({
      host: await getConfig('SMTP_HOST', process.env.SMTP_HOST),
      port: parseInt(await getConfig('SMTP_PORT', process.env.SMTP_PORT)),
      secure: false,
      ...SMTP_TIMEOUTS,
      auth: {
        user: await getConfig('SMTP_USER', process.env.SMTP_USER),
        pass: await getConfig('SMTP_PASS', process.env.SMTP_PASS)
      }
    });
    await transporter.verify();
    smtp = 'online';
  } catch {
    smtp = 'offline';
  }

  let ai = 'unknown';
  try {
    await pingGemini();
    ai = 'online';
  } catch {
    ai = 'offline';
  }

  externalCheckCache = { at: Date.now(), smtp, ai };
  return externalCheckCache;
};

const getSystemStatus = async (req, res) => {
  try {
    // Status database
    let dbStatus = 'online';
    let dbLatency = 0;
    try {
      const start = Date.now();
      await sequelize.authenticate();
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = 'offline';
    }

    // Status SMTP dan AI Service (di-cache, lihat checkExternalServices)
    const external = await checkExternalServices(req.query.force === '1');
    const smtpStatus = external.smtp;
    const aiStatus = external.ai;

    // Uptime
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeHours = Math.floor(uptimeSeconds / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60)
    const uptime = `${uptimeHours}j ${uptimeMinutes}m`

    // User aktif hari ini (login hari ini)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeUsers = await User.count({
      where: {
        last_login_at: { [Op.gte]: today }
      }
    });

    // Total user
    const totalUsers = await User.count({ where: { role: 'customer' } });

    // Memory usage
    const memUsed = Math.round((os.totalmem() - os.freemem()) / 1024 / 1024);
    const memTotal = Math.round(os.totalmem() / 1024 / 1024);

    return res.status(200).json({
      status: {
        database: { status: dbStatus, latency: `${dbLatency}ms` },
        smtp: { status: smtpStatus },
        ai_service: { status: aiStatus },
        server: {
          uptime,
	  uptime_seconds: Math.floor(process.uptime()),
          memory: `${memUsed}MB / ${memTotal}MB`,
          platform: os.platform(),
          node_version: process.version
        }
      },
      stats: {
        active_users_today: activeUsers,
        total_users: totalUsers
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    const { level, source, page = 1, limit = 20 } = req.query;
    const where = {};
    if (level) where.level = level;
    if (source) where.source = source; // mis. 'audit' untuk log audit aksi admin/sysadmin

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await SystemLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      logs: rows
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ===== KONFIGURASI LAYANAN EKSTERNAL =====
const getConfigs = async (req, res) => {
  try {
    const keys = [
      'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
      'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
      'GEMINI_API_KEY'
    ];

    const configs = {};
    for (const key of keys) {
      const config = await SystemConfig.findOne({ where: { key } });
      // Mask sensitive values (cek DB, fallback .env)
      const value = config?.value || process.env[key] || '';
      if (key.includes('PASS') || key.includes('SECRET') || key.includes('API_KEY')) {
        configs[key] = value ? '••••••••' : ''
      } else {
        configs[key] = value || process.env[key] || ''
      }
    }

    return res.status(200).json({ configs });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateConfigs = async (req, res) => {
  try {
    const { configs } = req.body;
    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({ message: 'Data konfigurasi tidak valid' });
    }

    const allowedKeys = [
      'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
      'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
      'GEMINI_API_KEY'
    ];

    for (const [key, value] of Object.entries(configs)) {
      if (!allowedKeys.includes(key)) continue;
      // Skip kalau value adalah mask
      if (value === '••••••••') continue;

      await SystemConfig.upsert({
        key,
        value,
        updated_by: req.user.user_id
      });
    }

    // Kredensial Google berubah: muat ulang strategi OAuth tanpa restart server
    if (Object.keys(configs).some(k => k.startsWith('GOOGLE_'))) {
      await passport.loadGoogleStrategy();
    }

    await saveLog('info', 'Konfigurasi sistem diperbarui', 'sysadmin', req.user.user_id, { keys: Object.keys(configs) });

    return res.status(200).json({ message: 'Konfigurasi berhasil disimpan' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const testSmtp = async (req, res) => {
  try {
    const smtpHost = await getConfig('SMTP_HOST', process.env.SMTP_HOST);
    const smtpPort = await getConfig('SMTP_PORT', process.env.SMTP_PORT);
    const smtpUser = await getConfig('SMTP_USER', process.env.SMTP_USER);
    const smtpPass = await getConfig('SMTP_PASS', process.env.SMTP_PASS);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: false,
      ...SMTP_TIMEOUTS,
      auth: { user: smtpUser, pass: smtpPass }
    });

    await transporter.verify();
    await saveLog('info', 'Test koneksi SMTP berhasil', 'smtp', req.user.user_id);
    return res.status(200).json({ message: 'Koneksi SMTP berhasil!', status: 'online' });
  } catch (err) {
    await saveLog('error', `Test koneksi SMTP gagal: ${err.message}`, 'smtp', req.user.user_id);
    return res.status(400).json({ message: `Koneksi SMTP gagal: ${err.message}`, status: 'offline' });
  }
};

const testAiService = async (req, res) => {
  try {
    await pingGemini();
    await saveLog('info', 'Test koneksi Gemini AI berhasil', 'ai_service', req.user.user_id);
    return res.status(200).json({ message: 'Gemini AI online!', status: 'online' });
  } catch (err) {
    await saveLog('warning', `Gemini AI tidak tersedia: ${err.message}`, 'ai_service', req.user.user_id);
    return res.status(400).json({ message: 'Gemini AI tidak dapat dijangkau, cek API key', status: 'offline' });
  }
};

// ===== MANAJEMEN USER =====
const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'google_id', 'reset_token', 'reset_token_expires'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    return res.status(200).json({ total: count, users: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const createUser = async (req, res) => {
  try {
    const { full_name, email, password, phone, role = 'customer', sysadmin_password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password minimal 8 karakter' });
    }
    if (!['customer', 'admin', 'sysadmin'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }

    // Membuat akun berhak istimewa (admin/sysadmin) butuh re-autentikasi sysadmin
    if (role === 'admin' || role === 'sysadmin') {
      if (!sysadmin_password) {
        return res.status(400).json({ message: 'Password Administrator Sistem wajib diisi untuk membuat akun admin/sysadmin' });
      }
      const actor = await User.findByPk(req.user.user_id);
      const isMatch = actor && await bcrypt.compare(sysadmin_password, actor.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Password Administrator Sistem tidak valid' });
      }
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name, email,
      password: hashedPassword,
      phone: phone || null,
      role, is_active: true, is_verified: true
    });

    await audit(req, { action: 'create', entity: 'user', entityId: user.user_id,
      message: `Akun baru dibuat: ${email} (${role})`,
      after: pickKeys(user, ['full_name', 'email', 'phone', 'role', 'is_active']) });

    return res.status(201).json({
      message: 'Akun berhasil dibuat',
      user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    // Role dan password sengaja diabaikan di sini: keduanya hanya boleh diubah lewat
    // set-role dan reset-password yang meminta konfirmasi password sysadmin.
    const { full_name, email, phone } = req.body;

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email sudah digunakan' });
    }

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const beforeSnap = pickKeys(user, ['full_name', 'email', 'phone', 'role', 'is_active']);
    await user.update(updateData);
    await audit(req, { action: 'update', entity: 'user', entityId: user.user_id,
      message: `Akun diupdate: ${user.email}`,
      ...changes(beforeSnap, pickKeys(user, ['full_name', 'email', 'phone', 'role', 'is_active'])) });

    return res.status(200).json({ message: 'Akun berhasil diupdate', user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { new_password, sysadmin_password } = req.body;

    if (!new_password || !sysadmin_password) {
      return res.status(400).json({ message: 'Password baru dan password sysadmin wajib diisi' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ message: 'Password baru minimal 8 karakter' });
    }

    // Re-autentikasi: verifikasi password sysadmin yang sedang login
    const sysadmin = await User.findByPk(req.user.user_id);
    const isMatch = await bcrypt.compare(sysadmin_password, sysadmin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password Administrator Sistem tidak valid' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const hashed = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashed });

    // Sandi tidak pernah dicatat, hanya fakta bahwa sandi direset
    await audit(req, { action: 'reset_password', entity: 'user', entityId: user.user_id,
      message: `Password user direset oleh sysadmin: ${user.email}`, level: 'warning' });

    return res.status(200).json({ message: `Password ${user.full_name} berhasil direset` });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { sysadmin_password } = req.body;

    if (String(req.params.id) === String(req.user.user_id)) {
      return res.status(400).json({ message: 'Tidak bisa menonaktifkan akun sendiri' });
    }

    // Re-autentikasi untuk aksi kritis
    if (!sysadmin_password) {
      return res.status(400).json({ message: 'Password Administrator Sistem wajib diisi untuk aksi ini' });
    }

    const sysadmin = await User.findByPk(req.user.user_id);
    const isMatch = await bcrypt.compare(sysadmin_password, sysadmin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password Administrator Sistem tidak valid' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const wasActive = user.is_active;
    await user.update({ is_active: !user.is_active });

    await audit(req, {
      action: 'toggle_status', entity: 'user', entityId: user.user_id, level: 'warning',
      message: `Akun ${user.is_active ? 'diaktifkan' : 'dinonaktifkan'}: ${user.email}`,
      before: { is_active: wasActive }, after: { is_active: user.is_active }
    });

    return res.status(200).json({
      message: `User berhasil ${user.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
      user
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const setUserRole = async (req, res) => {
  try {
    const { role, sysadmin_password } = req.body;

    if (String(req.params.id) === String(req.user.user_id)) {
      return res.status(400).json({ message: 'Tidak bisa mengubah role akun sendiri' });
    }

    // Re-autentikasi untuk ubah role
    if (!sysadmin_password) {
      return res.status(400).json({ message: 'Password Administrator Sistem wajib diisi untuk mengubah role' });
    }

    const sysadmin = await User.findByPk(req.user.user_id);
    const isMatch = await bcrypt.compare(sysadmin_password, sysadmin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password Administrator Sistem tidak valid' });
    }

    if (!['customer', 'admin', 'sysadmin'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const oldRole = user.role;
    await user.update({ role });

    await audit(req, {
      action: 'set_role', entity: 'user', entityId: user.user_id, level: 'warning',
      message: `Role user diubah: ${user.email} (${oldRole} → ${role})`,
      before: { role: oldRole }, after: { role }
    });

    return res.status(200).json({ message: `Role ${user.full_name} diubah menjadi ${role}`, user });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSystemStatus, getSystemLogs,
  getConfigs, updateConfigs, testSmtp, testAiService,
  getUsers, createUser, updateUser, resetUserPassword,
  toggleUserStatus, setUserRole
};