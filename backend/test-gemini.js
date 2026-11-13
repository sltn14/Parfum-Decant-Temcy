// Skrip diagnosa sementara (JANGAN di-commit). Taruh di folder backend, jalankan: node test-gemini.js
// Opsional: node test-gemini.js model-a model-b ...   (default: daftar kandidat di bawah)
// Key dibaca dari variabel lingkungan GEMINI_API_KEY dan tidak pernah dicetak.
const { GoogleGenAI } = require('@google/genai');

const key = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']+|["']+$/g, '');
if (!key) { console.log('Isi dulu: $env:GEMINI_API_KEY="..."  (PowerShell)'); process.exit(1); }

const defaults = [
  'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash',
  'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite',
  'gemini-2.5-flash', 'gemini-2.5-flash-lite'
];
const models = process.argv.length > 2 ? process.argv.slice(2) : defaults;
const ai = new GoogleGenAI({ apiKey: key });
const TRIES = 2;

(async () => {
  console.log('Node', process.version, '| tiap model dicoba', TRIES, 'kali lewat SDK (cara yang dipakai aplikasi)\n');
  const rows = [];
  for (const m of models) {
    const res = [];
    for (let i = 0; i < TRIES; i++) {
      const start = Date.now();
      try {
        const r = await Promise.race([
          ai.models.generateContent({ model: m, contents: 'Balas satu kata: halo', config: { maxOutputTokens: 256 } }),
          new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout 30 dtk'), { status: 'timeout' })), 30000))
        ]);
        res.push(`OK ${((Date.now() - start) / 1000).toFixed(1)}s`);
      } catch (e) {
        res.push(`${e.status || 'ERR'} ${((Date.now() - start) / 1000).toFixed(1)}s`);
      }
    }
    rows.push([m, res.join(' | ')]);
    console.log(m.padEnd(26), res.join(' | '));
  }
  const good = rows.filter(([, r]) => r.startsWith('OK') && r.split('|').every(x => x.trim().startsWith('OK'))).map(([m]) => m);
  console.log('\nModel yang berhasil dua kali:', good.length ? good.join(', ') : '(tidak ada, coba lagi beberapa menit lagi)');
})();
