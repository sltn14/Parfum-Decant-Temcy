const axios = require('axios');
const Product = require('../products/product.model');

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

const AI_ENDPOINT = process.env.AI_ENDPOINT_URL || 'http://localhost:8000/chat';

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
    // Kalau iya, ambil produk yang relevan (max 10, filter berdasarkan keywords)
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

      // Coba filter berdasarkan kata kunci spesifik
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
        order: [['sold_count', 'DESC']] // prioritas produk terlaris
      });

      products = productData.map(p => p.toJSON());
    }

    // Kirim ke AI service
    const payload = {
      message: message.trim(),
      session_id,
      history,
      ...(products.length > 0 && { products })
    };

    const aiResponse = await axios.post(AI_ENDPOINT, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const reply = aiResponse.data?.reply
      || aiResponse.data?.message
      || aiResponse.data?.response
      || 'Maaf, saya tidak bisa memproses permintaan kamu saat ini.';

    // Update history — tambah pesan baru
    history.push({ role: 'user', content: message.trim() });
    history.push({ role: 'assistant', content: reply });

    // Batasi history 20 pesan terakhir (10 pasang tanya-jawab)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // Simpan kembali dengan update lastActive
    sessionHistory.set(session_id, { history, lastActive: Date.now() });

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('AI Service Error:', err?.response?.data || err.message);

    // Bedakan error timeout vs error lain
    let fallbackReply = 'Maaf, Mincy AI sedang tidak tersedia. Silakan coba lagi nanti.';
    if (err.code === 'ECONNABORTED') {
      fallbackReply = 'Maaf, respon AI terlalu lama. Silakan coba lagi.';
    } else if (err.code === 'ECONNREFUSED') {
      fallbackReply = 'Maaf, layanan AI sedang offline. Silakan coba beberapa saat lagi.';
    }

    return res.status(200).json({ reply: fallbackReply });
  }
};

// Reset session tertentu (opsional, kalau user mau mulai percakapan baru)
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

module.exports = { chat, resetSession };