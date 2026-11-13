const SystemConfig = require('../modules/sysadmin/system_config.model');

// Ambil konfigurasi: database (diisi sysadmin) dulu, lalu .env sebagai cadangan.
const getConfig = async (key, fallback = null) => {
  try {
    const config = await SystemConfig.findOne({ where: { key } });
    return config?.value || process.env[key] || fallback;
  } catch {
    return process.env[key] || fallback;
  }
};

module.exports = { getConfig };
