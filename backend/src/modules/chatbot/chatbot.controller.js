const { GoogleGenAI } = require('@google/genai');
const Product = require('../products/product.model');

const SystemConfig = require('../sysadmin/system_config.model');

// Ambil client Gemini. API key dibaca dari DB (diatur sysadmin), fallback ke .env
let aiClient = null;
let aiClientKey = null;
const getAI = async () => {
  let apiKey = process.env.GEMINI_API_KEY;
  try {
    const cfg = await SystemConfig.findOne({ where: { key: 'GEMINI_API_KEY' } });
    if (cfg?.value) apiKey = cfg.value;
  } catch {}

  if (!apiKey) throw new Error('GEMINI_API_KEY belum diset');

  // Buat ulang client hanya kalau key berubah
  if (!aiClient || aiClientKey !== apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
    aiClientKey = apiKey;
  }
  return aiClient;
};

// Simpan history per session di memory (in-process)
const sessionHistory = new Map();

// Bersihkan session yang sudah lebih dari 2 jam (mencegah memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionHistory.entries()) {
    if (now - value.lastActive > 2 * 60 * 60 * 1000) {
      sessionHistory.delete(key);
    }
  }
}, 30 * 60 * 1000); // cek tiap 30 menit

const SYSTEM_INSTRUCTION = `Kamu adalah "Decant Temcy Bot", asisten AI resmi untuk platform marketplace parfum decant "Decant Temcy".
Tugas utamamu adalah membantu pelanggan menemukan varian parfum decant yang paling sesuai dengan preferensi aroma, gender, atau anggaran mereka.
Gunakan bahasa Indonesia yang ramah, profesional, dan kasual.
Kalau kamu punya data produk yang relevan, rekomendasikan secara spesifik dengan menyebut nama, brand, aroma utama, dan harga.`;

const chat = async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message wajib diisi' });
    }
    if (!session_id) {
      return res.status(400).json({ message: 'Session ID wajib diisi' });
    }

    // Ambil history session ini
    const sessionData = sessionHistory.get(session_id) || { history: [], lastActive: Date.now() };
    const history = sessionData.history;

    // Cek apakah pesan berkaitan dengan produk / rekomendasi
    let products = [];
    const productKeywords = [
      'rekomendasi', 'rekomendasikan', 'saran', 'sarankan', 'produk',
      'parfum', 'wangi', 'harga', 'brand', 'floral', 'woody', 'citrus',
      'spicy', 'fresh', 'vanilla', 'musky', 'aquatic', 'oud', 'manis',
      'segar', 'kayu', 'bunga', 'buah', 'ada apa', 'tersedia', 'jual'
    ];

    const messageLower = message.toLowerCase();
    const needsProductContext = productKeywords.some(kw => messageLower.includes(kw));

    if (needsProductContext) {
      const { Op } = require('sequelize');

      const aromaKeywords = ['floral', 'woody', 'citrus', 'spicy', 'fresh', 'vanilla', 'musky', 'aquatic', 'oud'];
      const matchedAroma = aromaKeywords.find(kw => messageLower.includes(kw));

      const where = { is_active: true };
      if (matchedAroma) {
        where[Op.or] = [
          { main_accords: { [Op.iLike]: `%${matchedAroma}%` } },
          { top_notes: { [Op.iLike]: `%${matchedAroma}%` } },
          { middle_notes: { [Op.iLike]: `%${matchedAroma}%` } },
          { base_notes: { [Op.iLike]: `%${matchedAroma}%` } }
        ];
      }

      const productData = await Product.findAll({
        where,
        attributes: [
          'product_id', 'brand', 'product_name', 'concentration',
          'gender', 'top_notes', 'middle_notes', 'base_notes',
          'main_accords', 'description', 'price_1ml', 'price_2ml',
          'price_3ml', 'price_5ml', 'longevity_display', 'pros', 'cons'
        ],
        limit: 10,
        order: [['sold_count', 'DESC']]
      });

      products = productData.map(p => p.toJSON());
    }

    // Susun prompt: history + produk konteks + pesan user
    let fullPrompt = '';

    // Sertakan history percakapan sebelumnya
    if (history.length > 0) {
      fullPrompt += history.map(h =>
        h.role === 'user' ? `User: ${h.content}` : `Decant Temcy Bot: ${h.content}`
      ).join('\n') + '\n\n';
    }

    // Sertakan data produk kalau relevan
    if (products.length > 0) {
      fullPrompt += `[Data Produk Tersedia di Decant Temcy]\n`;
      products.forEach((p, i) => {
        fullPrompt += `${i + 1}. ${p.brand} - ${p.product_name} (${p.concentration || '-'})\n`;
        fullPrompt += `   Gender: ${p.gender} | Aroma: ${p.main_accords || '-'}\n`;
        fullPrompt += `   Harga: 1ml=Rp${p.price_1ml?.toLocaleString('id-ID') || '-'}, 2ml=Rp${p.price_2ml?.toLocaleString('id-ID') || '-'}, 3ml=Rp${p.price_3ml?.toLocaleString('id-ID') || '-'}, 5ml=Rp${p.price_5ml?.toLocaleString('id-ID') || '-'}\n`;
        if (p.pros) fullPrompt += `   Kelebihan: ${p.pros}\n`;
        fullPrompt += '\n';
      });
    }

    fullPrompt += `User: ${message.trim()}`;

    // Panggil Gemini
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const reply = response.text || 'Maaf, saya tidak bisa memproses permintaan kamu saat ini.';

    // Update history
    history.push({ role: 'user', content: message.trim() });
    history.push({ role: 'assistant', content: reply });

    // Batasi history 20 pesan terakhir
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    sessionHistory.set(session_id, { history, lastActive: Date.now() });

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Gemini AI Error:', err?.message || err);

    let fallbackReply = 'Maaf, Mincy AI sedang tidak tersedia. Silakan coba lagi nanti.';
    if (err?.message?.includes('API_KEY')) {
      fallbackReply = 'Konfigurasi AI bermasalah. Hubungi admin.';
    }

    return res.status(200).json({ reply: fallbackReply });
  }
};

// Reset session tertentu
const resetSession = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (session_id) {
      sessionHistory.delete(session_id);
    }
    return res.status(200).json({ message: 'Session berhasil direset' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { chat, resetSession, getAI };