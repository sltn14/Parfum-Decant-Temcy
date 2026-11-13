// Klien untuk API chatbot tim AI (POST /api/chat, header X-API-Key).
// Backend kita hanya meneruskan pesan pelanggan lalu mengayakan hasilnya dengan data produk dari database.
// Logika percakapan dan rekomendasi sepenuhnya milik API itu; di sini tidak diubah.
const { getConfig } = require('../../utils/systemConfig');

const AI_TEAM_TIMEOUT_MS = Number(process.env.CHATBOT_API_TIMEOUT_MS || 15000);
const MAX_PRODUCT_CARDS = 10;

const clean = (v) => String(v || '').trim().replace(/^["']+|["']+$/g, '').trim();

// URL dan key dibaca dari konfigurasi SysAdmin (database), cadangan .env. Salah satu kosong = fitur nonaktif.
// Nama yang dipakai tim mobile (AI_ENDPOINT_URL berisi alamat lengkap .../api/chat, dan AI_API_KEY) juga diterima.
const getAiTeamConfig = async () => {
  const rawUrl = clean(await getConfig('CHATBOT_API_URL')) || clean(await getConfig('AI_ENDPOINT_URL'));
  const url = rawUrl.replace(/\/+$/, '').replace(/\/api\/chat$/i, '');
  const apiKey = clean(await getConfig('CHATBOT_API_KEY')) || clean(await getConfig('AI_API_KEY'));
  return url && apiKey ? { url, apiKey } : null;
};

// API tim AI menyimpan keadaan percakapan per session_id dan tidak punya endpoint reset.
// Reset dari pelanggan dilakukan dengan menaikkan "generasi" sehingga session_id yang dikirim berganti.
const generations = new Map();
const aiTeamSessionId = (key) => (generations.get(key) ? `${key}#${generations.get(key)}` : key);
const resetAiTeamSession = (key) => generations.set(key, (generations.get(key) || 0) + 1);

const callAiTeamChat = async ({ url, apiKey, sessionId, message, timeoutMs = AI_TEAM_TIMEOUT_MS, fetchImpl = globalThis.fetch }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetchImpl(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ session_id: sessionId, message }),
      signal: controller.signal
    });
    if (!resp.ok) throw Object.assign(new Error(`Chatbot API HTTP ${resp.status}`), { status: resp.status });
    const data = await resp.json();
    if (typeof data?.reply !== 'string') throw new Error('Format balasan chatbot API tidak dikenali');
    return { reply: data.reply, recommendations: Array.isArray(data.recommendations) ? data.recommendations : [] };
  } catch (err) {
    if (err?.name === 'AbortError') throw Object.assign(new Error('Chatbot API timeout'), { code: 'AI_TEAM_TIMEOUT' });
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// Data yang boleh tampil di kartu produk (tanpa harga modal, stok, atau data internal lain)
const PRODUCT_CARD_FIELDS = [
  'product_id', 'brand', 'product_name', 'concentration', 'gender',
  'top_notes', 'middle_notes', 'base_notes', 'main_accords', 'characteristic', 'longevity_display',
  'price_1ml', 'price_2ml', 'price_3ml', 'price_5ml', 'image_filename'
];

// Ubah rekomendasi API (product_id + skor) menjadi data kartu lengkap dari database.
// Urutan mengikuti API; produk yang tidak ada atau nonaktif di database dibuang.
const enrichRecommendations = async (recommendations, ProductModel) => {
  const recs = (Array.isArray(recommendations) ? recommendations : [])
    .filter(r => Number.isInteger(Number(r?.product_id)))
    .slice(0, MAX_PRODUCT_CARDS);
  if (!recs.length) return [];

  const { Op } = require('sequelize');
  const rows = await ProductModel.findAll({
    where: { product_id: { [Op.in]: recs.map(r => Number(r.product_id)) }, is_active: true },
    attributes: PRODUCT_CARD_FIELDS
  });
  const byId = new Map(rows.map(r => { const p = r.toJSON ? r.toJSON() : r; return [Number(p.product_id), p]; }));

  return recs.map(r => {
    const p = byId.get(Number(r.product_id));
    if (!p) return null;
    const percent = Number(r.match_percent);
    return { ...p, match_percent: Number.isFinite(percent) ? Math.round(percent) : null };
  }).filter(Boolean);
};

module.exports = { getAiTeamConfig, callAiTeamChat, enrichRecommendations, aiTeamSessionId, resetAiTeamSession, PRODUCT_CARD_FIELDS };
