const { GoogleGenAI } = require('@google/genai');
const Product = require('../products/product.model');

const { getConfig } = require('../../utils/systemConfig');
const { getAiTeamConfig, callAiTeamChat, enrichRecommendations, aiTeamSessionId, resetAiTeamSession } = require('./aiTeamClient');

const MAX_MESSAGE_LENGTH = 1000;
// AI Insight admin mengirim prompt analisis berisi data penjualan (>1000 karakter), jadi admin diberi batas lebih longgar
const MAX_MESSAGE_LENGTH_ADMIN = 4000;
const MAX_SESSION_ID_LENGTH = 100;
// Batas waktu PER PERCOBAAN. Kalau model utama gagal, model cadangan diberi satu kesempatan lagi,
// jadi total terburuk = jumlah model x batas ini (503 biasanya dijawab dalam hitungan detik).
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 12000);
// Model dipakai bersama chatbot dan tes koneksi sysadmin. Semuanya bisa diganti lewat env.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
// Model cadangan (boleh lebih dari satu, dipisah koma) dicoba berurutan bila model utama sibuk/timeout/tidak ada
const GEMINI_FALLBACK_MODELS = (process.env.GEMINI_MODEL_FALLBACK || 'gemini-3.5-flash-lite,gemini-3.5-flash')
  .split(',').map(m => m.trim()).filter(Boolean);
// 'generate' (generateContent, default) atau 'interactions' (ai.interactions.create)
const GEMINI_API_MODE = process.env.GEMINI_API_MODE || 'generate';
// Token thinking ikut dihitung di batas ini, jadi jangan terlalu kecil
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 2048);
const GEMINI_THINKING_LEVEL = process.env.GEMINI_THINKING_LEVEL || 'medium';
// Retry singkat pada model yang sama untuk error cepat 5xx (503 "high demand" sering hilang dalam hitungan detik).
// Timeout tidak diulang supaya total waktu tunggu tidak berlipat.
const GEMINI_RETRIES = Number(process.env.GEMINI_RETRIES ?? 1);
const GEMINI_RETRY_DELAY_MS = Number(process.env.GEMINI_RETRY_DELAY_MS ?? 800);
// Pencarian Google untuk data di luar database (hanya chatbot pelanggan). Mati secara default karena
// ada biaya per pencarian dan jawabannya bisa keluar dari katalog toko. Nyalakan dengan GEMINI_SEARCH=true
const GEMINI_SEARCH = String(process.env.GEMINI_SEARCH || '').toLowerCase() === 'true';

// Jalankan promise dengan batas waktu; error.code = 'GEMINI_TIMEOUT' bila terlambat
const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('Gemini timeout');
      err.code = 'GEMINI_TIMEOUT';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Error yang pantas dicoba ulang dengan model cadangan: server sibuk, kuota, timeout, model tidak ada
const isRetryable = (err) => {
  if (err?.code === 'GEMINI_TIMEOUT') return true;
  if ([404, 429, 500, 502, 503, 504].includes(Number(err?.status))) return true;
  return /UNAVAILABLE|overloaded|RESOURCE_EXHAUSTED|not found/i.test(String(err?.message || ''));
};

// Ambil teks jawaban dari respons Interactions API (output_text, atau dirangkai dari steps)
const interactionText = (interaction) => {
  if (interaction?.output_text) return interaction.output_text;
  return (interaction?.steps || [])
    .filter(step => step.type === 'model_output')
    .flatMap(step => step.content || [])
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('\n');
};

// Satu pintu pemanggilan Gemini untuk chatbot dan tes koneksi sysadmin.
// Mencoba model utama, lalu model cadangan bila errornya sementara (503/429/timeout/404).
// Error lain (mis. 400 argumen salah) langsung dilempar karena model lain pun akan menolaknya.
const generateText = async (ai, { prompt, systemInstruction, maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS,
  timeoutMs = GEMINI_TIMEOUT_MS, models, mode = GEMINI_API_MODE, useSearch = false,
  retries = GEMINI_RETRIES, retryDelayMs = GEMINI_RETRY_DELAY_MS } = {}) => {
  const chain = [...new Set((models || [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS]).filter(Boolean))];
  let lastErr;
  for (const model of chain) {
    for (let attempt = 0; ; attempt++) {
      try {
        if (mode === 'interactions') {
          // store:false = percakapan tidak disimpan di server Google (riwayat dikelola backend sendiri)
          const interaction = await withTimeout(ai.interactions.create({
            model,
            input: prompt,
            ...(systemInstruction ? { system_instruction: systemInstruction } : {}),
            ...(useSearch ? { tools: [{ type: 'google_search' }] } : {}),
            generation_config: { max_output_tokens: maxOutputTokens, thinking_level: GEMINI_THINKING_LEVEL },
            store: false
          }), timeoutMs);
          return { text: interactionText(interaction), model };
        }
        const response = await withTimeout(ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
            maxOutputTokens
          }
        }), timeoutMs);
        return { text: response.text || '', model };
      } catch (err) {
        lastErr = err;
        if (!isRetryable(err)) throw err;
        if (attempt < retries && [500, 502, 503, 504].includes(Number(err?.status))) {
          await new Promise(r => setTimeout(r, retryDelayMs));
          continue;
        }
        // Untuk 429, tampilkan "limit: N" dari pesan Google (limit: 0 = model itu tidak punya kuota gratis)
        const quota = String(err?.message || '').match(/limit: \d+/)?.[0];
        console.warn(`Gemini ${model} gagal (${err.status || err.code || err.message}${quota ? `, ${quota}` : ''}), mencoba model berikutnya`);
        break;
      }
    }
  }
  throw lastErr;
};

// Frontend menampilkan balasan apa adanya (bukan markdown), jadi simbol seperti ** dan * tampil mentah.
// Untuk pelanggan, ubah markdown menjadi teks polos. TIDAK dipakai untuk admin: AI Insight membaca **JUDUL**.
const plainText = (text) => String(text || '')
  .replace(/^\s{0,3}#{1,6}\s+/gm, '')                                // judul "## ..."
  .replace(/^\s*([-*_])(\s*\1){2,}\s*$/gm, '')                       // garis pemisah ---
  .replace(/^(\s*)[*+]\s+/gm, '$1- ')                                // daftar "* item" -> "- item"
  .replace(/(\*\*|__)(?=\S)(.+?)(?<=\S)\1/g, '$2')                  // tebal **x**
  .replace(/(^|[^\w*])\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*(?![\w*])/g, '$1$2') // miring *x*
  .replace(/`([^`\n]+)`/g, '$1')                                     // kode `x`
  .replace(/\n{3,}/g, '\n\n')
  .trim();

// Aturan gaya yang ditambahkan khusus untuk pelanggan
const CUSTOMER_STYLE_RULE = `
Format jawaban: tulis teks biasa TANPA markdown. Jangan pakai tanda bintang (*), pagar (#), garis (---), atau tabel.
Untuk daftar gunakan penomoran "1." atau tanda "-" di awal baris.`;

// Kunci sesi memuat user_id dari token (req.user), bukan hanya session_id buatan klien,
// sehingga user lain yang menebak session_id tidak bisa membaca/menimpa riwayat orang lain.
const sessionKey = (req, sessionId) => `${req.user.user_id}:${sessionId}`;

// Ambil client Gemini. API key dibaca dari DB (diatur sysadmin), fallback ke .env
let aiClient = null;
let aiClientKey = null;
const getAI = async () => {
  // Hilangkan spasi/baris baru/tanda kutip yang sering ikut tertempel saat menyalin key
  const apiKey = String((await getConfig('GEMINI_API_KEY')) || '').trim().replace(/^["']+|["']+$/g, '').trim();

  if (!apiKey) throw new Error('GEMINI_API_KEY belum diset');

  // Buat ulang client hanya kalau key berubah
  if (!aiClient || aiClientKey !== apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
    aiClientKey = apiKey;
  }
  return aiClient;
};

// ---- Cadangan AI: Groq (API kompatibel OpenAI). Aktif hanya bila GROQ_API_KEY terisi, dan hanya untuk pelanggan ----
// Tidak punya Google Search. Teks pelanggan terkirim ke Groq saat Gemini gagal (catat di kebijakan privasi).
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'; // ganti via env bila model ini sudah tidak tersedia
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 15000);
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getGroqKey = async () =>
  String((await getConfig('GROQ_API_KEY')) || '').trim().replace(/^["']+|["']+$/g, '').trim();

const generateGroq = async ({ apiKey, prompt, systemInstruction, maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS,
  model = GROQ_MODEL, timeoutMs = GROQ_TIMEOUT_MS, fetchImpl = globalThis.fetch } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetchImpl(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt }
        ],
        max_tokens: maxOutputTokens
      }),
      signal: controller.signal
    });
    if (!resp.ok) {
      throw Object.assign(new Error(`Groq HTTP ${resp.status}`), { status: resp.status });
    }
    const data = await resp.json();
    return { text: data?.choices?.[0]?.message?.content || '', model };
  } catch (err) {
    if (err?.name === 'AbortError') throw Object.assign(new Error('Groq timeout'), { code: 'GROQ_TIMEOUT' });
    throw err;
  } finally {
    clearTimeout(timer);
  }
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
}, 30 * 60 * 1000).unref(); // cek tiap 30 menit; unref agar tidak menahan proses (mis. Jest) tetap hidup

const SYSTEM_INSTRUCTION = `Kamu adalah "Mincy", asisten AI resmi platform parfum decant "Decant Temcy".
Tugasmu membantu pelanggan menemukan parfum decant yang sesuai preferensi aroma, gender, atau anggaran.

Gaya menjawab:
- Bahasa Indonesia santai dan ramah, panggil pelanggan "Kak".
- Singkat: maksimal 3 rekomendasi, tiap rekomendasi maksimal 3 baris.
- Maksimal satu emoji per balasan.

Aturan data:
- Nama produk, harga, dan ketersediaan HANYA boleh dari [Data Produk] yang diberikan. Jangan mengarang produk, harga, atau stok.
- Kalau pelanggan menyebut parfum yang tidak ada di toko, jelaskan singkat karakter aromanya (notes dan kesan utama) hanya jika kamu yakin atau menemukannya lewat pencarian. Lalu tawarkan produk dari [Data Produk] yang notes atau main accords-nya paling mirip, sebutkan kesamaannya.
- Pisahkan jelas info umum tentang parfum itu dari info produk toko kita. Jangan menyebut harga atau toko lain.
- Kalau tidak yakin atau tidak menemukan sumber yang jelas, katakan terus terang. Jangan menebak notes parfum.
- Kalau pertanyaan di luar parfum atau toko, arahkan kembali dengan sopan ke topik parfum.
- Kalau data produk kosong atau kurang, tanyakan satu pertanyaan klarifikasi (aroma, anggaran, atau acara).`;

// Instruksi untuk admin/sysadmin (mis. AI Insight): analis bisnis, BUKAN persona Mincy. Format jawaban mengikuti
// permintaan di pesan (AI Insight meminta bagian RINGKASAN PERFORMA, INSIGHT UTAMA, dst.).
const ADMIN_SYSTEM_INSTRUCTION = `Kamu adalah AI business analyst untuk toko parfum decant "Decant Temcy".
Kerjakan persis tugas dan format yang diminta di pesan. Gunakan hanya data yang diberikan di pesan; jangan mengarang angka, produk, atau fakta.
Gunakan bahasa Indonesia yang profesional dan mudah dipahami, fokus pada insight yang actionable untuk pemilik toko kecil.
Jangan memanggil pengguna "Kak" dan jangan mengubah topik menjadi rekomendasi parfum untuk pelanggan.`;

// ---- Fallback tanpa AI: dipakai pelanggan saat semua model Gemini gagal ----
// Hanya mencocokkan kata kunci aroma/gender ke katalog toko (tidak bisa menjawab pertanyaan bebas atau
// parfum di luar katalog). Query lewat Sequelize (parameter terikat), jadi aman dari SQL injection.
const FALLBACK_ACCORDS = [
  ['vanilla', ['vanilla', 'vanila']], ['woody', ['woody', 'kayu']], ['floral', ['floral', 'bunga']],
  ['citrus', ['citrus', 'jeruk', 'lemon']], ['fresh', ['fresh', 'segar']], ['sweet', ['sweet', 'manis']],
  ['fruity', ['fruity', 'buah']], ['spicy', ['spicy', 'rempah']], ['musk', ['musk', 'musky']],
  ['oud', ['oud', 'gaharu']], ['aquatic', ['aquatic', 'laut', 'marine']], ['coconut', ['coconut', 'kelapa']],
  ['smoky', ['smoky', 'asap']], ['leather', ['leather', 'kulit']], ['powdery', ['powdery', 'bedak']]
];
const FALLBACK_GENDERS = [
  ['Male', ['pria', 'cowok', 'cowo', 'laki', 'male', 'men']],
  ['Female', ['wanita', 'cewek', 'cewe', 'perempuan', 'female', 'women']]
];

const buildFallbackFilter = (message) => {
  const text = String(message || '').toLowerCase();
  const accords = FALLBACK_ACCORDS.filter(([, words]) => words.some(w => text.includes(w))).map(([a]) => a);
  const gender = (FALLBACK_GENDERS.find(([, words]) => words.some(w => new RegExp(`\\b${w}\\b`).test(text))) || [])[0] || null;
  return { accords, gender };
};

const formatFallbackReply = (products) => {
  const intro = 'Maaf Kak, Mincy AI sedang sibuk. ';
  if (!products.length) {
    return intro + 'Belum ada produk yang cocok dengan kata kunci tadi. Coba sebut aroma (misalnya vanilla, woody, atau segar) atau untuk siapa parfumnya, ya.';
  }
  const rupiah = (n) => (n ? `Rp${Number(n).toLocaleString('id-ID')}` : '-');
  const lines = products.map((p, i) =>
    `${i + 1}. ${p.brand} - ${p.product_name} (${p.concentration || '-'})\n   Aroma: ${p.main_accords || '-'} | 1ml ${rupiah(p.price_1ml)}, 5ml ${rupiah(p.price_5ml)}`);
  return `${intro}Sementara ini beberapa produk dari katalog kami yang mungkin cocok:\n${lines.join('\n')}`;
};

const dbFallbackReply = async (message) => {
  const { Op } = require('sequelize');
  const { accords, gender } = buildFallbackFilter(message);
  const where = { is_active: true };
  if (accords.length) {
    where[Op.or] = accords.flatMap(a => ['main_accords', 'top_notes', 'middle_notes', 'base_notes']
      .map(col => ({ [col]: { [Op.iLike]: `%${a}%` } })));
  }
  if (gender) where.gender = { [Op.in]: [gender, 'Unisex'] };
  const rows = await Product.findAll({
    where,
    attributes: ['brand', 'product_name', 'concentration', 'main_accords', 'price_1ml', 'price_5ml'],
    limit: 3,
    order: [['sold_count', 'DESC']]
  });
  return formatFallbackReply(rows.map(r => r.toJSON()));
};

const chat = async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message wajib diisi' });
    }
    const maxLen = ['admin', 'sysadmin'].includes(req.user.role) ? MAX_MESSAGE_LENGTH_ADMIN : MAX_MESSAGE_LENGTH;
    if (typeof message !== 'string' || message.length > maxLen) {
      return res.status(400).json({ message: `Pesan maksimal ${maxLen} karakter` });
    }
    if (!session_id || typeof session_id !== 'string' || session_id.length > MAX_SESSION_ID_LENGTH) {
      return res.status(400).json({ message: 'Session ID wajib diisi' });
    }

    // Ambil history session ini
    const key = sessionKey(req, session_id);
    const sessionData = sessionHistory.get(key) || { history: [], lastActive: Date.now() };
    const history = sessionData.history;

    // Pelanggan: pakai chatbot tim AI bila dikonfigurasi (CHATBOT_API_URL + CHATBOT_API_KEY).
    // Bila API-nya mati/lambat/error, lanjut ke Gemini di bawah, jadi chatbot tidak berhenti.
    if (req.user.role === 'customer') {
      const aiTeam = await getAiTeamConfig();
      if (aiTeam) {
        try {
          const out = await callAiTeamChat({ ...aiTeam, sessionId: aiTeamSessionId(key), message: message.trim() });
          let products = [];
          try {
            products = await enrichRecommendations(out.recommendations, Product);
          } catch (dbErr) {
            console.error('Gagal mengambil data produk rekomendasi:', dbErr?.message || dbErr);
          }
          const reply = plainText(out.reply) || 'Maaf, saya tidak bisa memproses permintaan kamu saat ini.';

          history.push({ role: 'user', content: message.trim() });
          history.push({ role: 'assistant', content: reply });
          if (history.length > 20) history.splice(0, history.length - 20);
          sessionHistory.set(key, { history, lastActive: Date.now() });

          return res.status(200).json({ reply, products, source: 'ai-team' });
        } catch (aiErr) {
          console.warn(`Chatbot tim AI gagal (${aiErr?.status || aiErr?.code || aiErr?.message}), memakai Gemini`);
        }
      }
    }

    // Cek apakah pesan berkaitan dengan produk / rekomendasi
    let products = [];
    const productKeywords = [
      'rekomendasi', 'rekomendasikan', 'saran', 'sarankan', 'produk',
      'parfum', 'wangi', 'harga', 'brand', 'floral', 'woody', 'citrus',
      'spicy', 'fresh', 'vanilla', 'musky', 'aquatic', 'oud', 'manis',
      'segar', 'kayu', 'bunga', 'buah', 'ada apa', 'tersedia', 'jual',
      'mirip', 'serupa', 'alternatif', 'dupe', 'clone', 'pengganti'
    ];

    const messageLower = message.toLowerCase();
    const needsProductContext = productKeywords.some(kw => messageLower.includes(kw));

    const wantsSimilar = ['mirip', 'serupa', 'alternatif', 'dupe', 'clone', 'pengganti'].some(kw => messageLower.includes(kw));

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

      // Pencarian "mirip": kirim hampir seluruh katalog tapi ringkas (tanpa deskripsi/pros/cons) agar prompt tetap kecil
      const attributes = wantsSimilar
        ? ['product_id', 'brand', 'product_name', 'concentration', 'gender', 'top_notes', 'middle_notes', 'base_notes', 'main_accords', 'price_1ml', 'price_5ml']
        : [
          'product_id', 'brand', 'product_name', 'concentration',
          'gender', 'top_notes', 'middle_notes', 'base_notes',
          'main_accords', 'description', 'price_1ml', 'price_2ml',
          'price_3ml', 'price_5ml', 'longevity_display', 'pros', 'cons'
        ];

      const productData = await Product.findAll({
        where,
        attributes,
        limit: wantsSimilar ? 80 : 10,
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

    // Panggil Gemini; untuk pelanggan, bila gagal dan GROQ_API_KEY ada, pakai Groq sebagai cadangan
    const isCustomer = req.user.role === 'customer';
    const aiOptions = {
      prompt: fullPrompt,
      systemInstruction: isCustomer ? SYSTEM_INSTRUCTION + CUSTOMER_STYLE_RULE : ADMIN_SYSTEM_INSTRUCTION
    };
    let text;
    try {
      const ai = await getAI();
      ({ text } = await generateText(ai, { ...aiOptions, useSearch: isCustomer && GEMINI_SEARCH }));
    } catch (geminiErr) {
      const groqKey = isCustomer ? await getGroqKey() : '';
      if (!groqKey) throw geminiErr;
      console.warn(`Gemini gagal (${geminiErr?.status || geminiErr?.code || geminiErr?.message}), memakai cadangan Groq`);
      ({ text } = await generateGroq({ apiKey: groqKey, ...aiOptions }));
    }

    const cleaned = isCustomer ? plainText(text) : text;
    const reply = cleaned || 'Maaf, saya tidak bisa memproses permintaan kamu saat ini.';

    // Update history
    history.push({ role: 'user', content: message.trim() });
    history.push({ role: 'assistant', content: reply });

    // Batasi history 20 pesan terakhir
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    sessionHistory.set(key, { history, lastActive: Date.now() });

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Gemini AI Error:', err?.message || err);

    let fallbackReply = 'Maaf, Mincy AI sedang tidak tersedia. Silakan coba lagi nanti.';
    if (err?.code === 'GEMINI_TIMEOUT') {
      fallbackReply = 'Mincy AI membutuhkan waktu terlalu lama untuk menjawab. Silakan coba lagi.';
    } else if (err?.message?.includes('API_KEY')) {
      fallbackReply = 'Konfigurasi AI bermasalah. Hubungi admin.';
    }

    // Pelanggan: rekomendasi dari katalog (tanpa AI) supaya fitur tidak mati total. Status 200 karena jawabannya valid.
    if (req.user?.role === 'customer' && typeof req.body?.message === 'string') {
      try {
        const reply = await dbFallbackReply(req.body.message);
        return res.status(200).json({ reply, fallback: true });
      } catch (dbErr) {
        console.error('Fallback katalog gagal:', dbErr?.message || dbErr);
      }
    }

    // 503 supaya klien (mis. AI Insight admin) bisa memakai fallback; ChatbotPage membaca `reply` dari error
    return res.status(503).json({ reply: fallbackReply, message: fallbackReply });
  }
};

// Reset session tertentu
const resetSession = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (session_id) {
      sessionHistory.delete(sessionKey(req, session_id));
      resetAiTeamSession(sessionKey(req, session_id));
    }
    return res.status(200).json({ message: 'Session berhasil direset' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { chat, resetSession, getAI, GEMINI_MODEL, withTimeout, generateText, plainText, buildFallbackFilter, formatFallbackReply, generateGroq };
