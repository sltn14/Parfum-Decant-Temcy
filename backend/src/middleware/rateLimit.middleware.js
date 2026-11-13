// Pembatas laju sederhana di memori (per IP + rute), tanpa dependensi tambahan.
// Cukup untuk satu proses server. Jika nanti memakai banyak instance,
// ganti dengan express-rate-limit + penyimpanan bersama (mis. Redis).
const rateLimit = ({ windowMs, max, message = 'Terlalu banyak permintaan' }) => {
  const hits = new Map(); // key -> { count, resetAt }

  // Bersihkan entri kedaluwarsa agar memori tidak terus tumbuh
  setInterval(() => {
    const now = Date.now();
    for (const [key, v] of hits) if (v.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ message });
    }
    next();
  };
};

module.exports = { rateLimit };
