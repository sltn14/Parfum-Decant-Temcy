const SystemLog = require('../modules/sysadmin/system_log.model');

// Satu-satunya jalur penulisan ke system_logs (menggantikan dua salinan saveLog lama).
// Kegagalan menulis log TIDAK boleh menggagalkan request, jadi semua error ditelan.
const writeLog = async (level, message, source = null, userId = null, metadata = null) => {
  try {
    await SystemLog.create({ level, message, source, user_id: userId, metadata });
  } catch (err) {
    console.error('writeLog gagal:', err.message);
  }
};

// Kunci yang tidak pernah boleh masuk log (sandi, token, rahasia)
const SENSITIVE_KEY = /pass|token|secret|signature/i;

const plain = (obj) => (obj && typeof obj.get === 'function' ? obj.get({ plain: true }) : obj);

// Salin objek tanpa kunci sensitif
const clean = (obj) => {
  const src = plain(obj);
  if (!src || typeof src !== 'object') return src ?? null;
  const out = {};
  for (const [k, v] of Object.entries(src)) if (!SENSITIVE_KEY.test(k)) out[k] = v;
  return out;
};

// Ambil subset kunci dari objek/instance Sequelize
const pickKeys = (obj, keys) => {
  const src = plain(obj) || {};
  const out = {};
  for (const k of keys) if (src[k] !== undefined) out[k] = src[k];
  return out;
};

// Bandingkan dua snapshot: hanya kunci yang berubah, { before, after }
const changes = (before = {}, after = {}) => {
  const b = {}; const a = {};
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (String(before[k] ?? '') !== String(after[k] ?? '')) { b[k] = before[k] ?? null; a[k] = after[k] ?? null; }
  }
  return { before: b, after: a };
};

// Catat aksi ke log audit: level 'info' (atau sesuai opsi), source 'audit'.
// `req` boleh null untuk aksi sistem (mis. webhook). metadata:
// { actor: {user_id, role}, action, entity, entity_id, before, after }
const audit = async (req, { action, entity, entityId = null, message, before = null, after = null, level = 'info' }) => {
  const actor = req?.user
    ? { user_id: req.user.user_id, role: req.user.role }
    : { user_id: null, role: 'system' };
  await writeLog(
    level,
    message || `${action} ${entity}${entityId ? ` #${entityId}` : ''}`,
    'audit',
    actor.user_id,
    { actor, action, entity, entity_id: entityId, before: clean(before), after: clean(after) }
  );
};

module.exports = { writeLog, audit, pickKeys, changes, clean };
