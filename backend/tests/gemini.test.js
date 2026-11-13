// Unit test generateText (model utama + cadangan, mode API). Tidak butuh database; Gemini = objek palsu.
const { generateText, plainText, buildFallbackFilter, formatFallbackReply, generateGroq } = require('../src/modules/chatbot/chatbot.controller');

const apiError = (status, message = 'x') => Object.assign(new Error(message), { status });
const aiWith = (impl) => ({
  models: { generateContent: jest.fn(impl.generate) },
  interactions: { create: jest.fn(impl.interact || (async () => ({ output_text: 'dari interactions' }))) }
});
const calledModels = (fn) => fn.mock.calls.map(c => c[0].model);
const OPTS = { prompt: 'halo', models: ['utama', 'cadangan'], timeoutMs: 50, retries: 0 };

describe('generateText: model utama dan cadangan', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  test('model utama berhasil: cadangan tidak dipanggil', async () => {
    const ai = aiWith({ generate: async () => ({ text: 'jawaban' }) });
    const r = await generateText(ai, OPTS);
    expect(r).toEqual({ text: 'jawaban', model: 'utama' });
    expect(calledModels(ai.models.generateContent)).toEqual(['utama']);
  });

  test('503 pada model utama: pindah ke model cadangan', async () => {
    const ai = aiWith({ generate: async ({ model }) => { if (model === 'utama') throw apiError(503); return { text: 'dari cadangan' }; } });
    const r = await generateText(ai, OPTS);
    expect(r).toEqual({ text: 'dari cadangan', model: 'cadangan' });
    expect(calledModels(ai.models.generateContent)).toEqual(['utama', 'cadangan']);
  });

  test('404 (model tidak ada) dan 429 juga memicu cadangan', async () => {
    for (const status of [404, 429]) {
      const ai = aiWith({ generate: async ({ model }) => { if (model === 'utama') throw apiError(status); return { text: 'ok' }; } });
      expect((await generateText(ai, OPTS)).model).toBe('cadangan');
    }
  });

  test('timeout pada model utama: pindah ke cadangan', async () => {
    const ai = aiWith({ generate: ({ model }) => (model === 'utama' ? new Promise(() => {}) : Promise.resolve({ text: 'cepat' })) });
    const r = await generateText(ai, OPTS);
    expect(r.model).toBe('cadangan');
  });

  test('400 (argumen salah) tidak dicoba ulang', async () => {
    const ai = aiWith({ generate: async () => { throw apiError(400, 'INVALID_ARGUMENT'); } });
    await expect(generateText(ai, OPTS)).rejects.toMatchObject({ status: 400 });
    expect(ai.models.generateContent).toHaveBeenCalledTimes(1);
  });

  test('semua model gagal: melempar error terakhir', async () => {
    const ai = aiWith({ generate: async () => { throw apiError(503); } });
    await expect(generateText(ai, OPTS)).rejects.toMatchObject({ status: 503 });
    expect(ai.models.generateContent).toHaveBeenCalledTimes(2);
  });

  test('model utama dan cadangan sama: hanya dicoba sekali', async () => {
    const ai = aiWith({ generate: async () => { throw apiError(503); } });
    await expect(generateText(ai, { ...OPTS, models: ['sama', 'sama'] })).rejects.toBeDefined();
    expect(ai.models.generateContent).toHaveBeenCalledTimes(1);
  });

  test('mode generate memakai systemInstruction dan batas token', async () => {
    const ai = aiWith({ generate: async () => ({ text: 'x' }) });
    await generateText(ai, { ...OPTS, systemInstruction: 'Kamu bot', maxOutputTokens: 123 });
    const arg = ai.models.generateContent.mock.calls[0][0];
    expect(arg.contents).toBe('halo');
    expect(arg.config).toEqual({ systemInstruction: 'Kamu bot', maxOutputTokens: 123 });
  });

  test('mode interactions: store false, tanpa tools, teks dari output_text', async () => {
    const ai = aiWith({ generate: async () => ({ text: 'tidak dipakai' }) });
    const r = await generateText(ai, { ...OPTS, mode: 'interactions', systemInstruction: 'Kamu bot', maxOutputTokens: 77 });
    expect(r).toEqual({ text: 'dari interactions', model: 'utama' });
    expect(ai.models.generateContent).not.toHaveBeenCalled();
    const arg = ai.interactions.create.mock.calls[0][0];
    expect(arg.store).toBe(false);
    expect(arg.tools).toBeUndefined();
    expect(arg.system_instruction).toBe('Kamu bot');
    expect(arg.generation_config.max_output_tokens).toBe(77);
  });

  test('mode interactions: teks dirangkai dari steps bila output_text kosong', async () => {
    const ai = aiWith({ generate: async () => ({}), interact: async () => ({ steps: [
      { type: 'thought', content: [{ type: 'text', text: 'abaikan' }] },
      { type: 'model_output', content: [{ type: 'text', text: 'halo' }, { type: 'text', text: 'dunia' }] }
    ] }) });
    expect((await generateText(ai, { ...OPTS, mode: 'interactions' })).text).toBe('halo\ndunia');
  });
});

describe('generateText: Google Search (opsional)', () => {
  test('useSearch menambah tool di mode generate dan interactions; default tanpa tool', async () => {
    const ai = aiWith({ generate: async () => ({ text: 'x' }) });
    await generateText(ai, { ...OPTS, useSearch: true });
    await generateText(ai, OPTS);
    await generateText(ai, { ...OPTS, mode: 'interactions', useSearch: true });
    expect(ai.models.generateContent.mock.calls[0][0].config.tools).toEqual([{ googleSearch: {} }]);
    expect(ai.models.generateContent.mock.calls[1][0].config.tools).toBeUndefined();
    expect(ai.interactions.create.mock.calls[0][0].tools).toEqual([{ type: 'google_search' }]);
  });
});

describe('plainText: bersihkan markdown untuk pelanggan', () => {
  test('hapus tebal, miring, judul, garis, dan ubah bullet', () => {
    expect(plainText('Halo **Kak**, aroma *woody*')).toBe('Halo Kak, aroma woody');
    expect(plainText('## Judul\nIsi')).toBe('Judul\nIsi');
    expect(plainText('Atas\n\n---\n\nBawah')).toBe('Atas\n\nBawah');
    expect(plainText('1. **SAFF**\n   * Gender: Unisex')).toBe('1. SAFF\n   - Gender: Unisex');
  });
  test('perkalian dan teks kosong tidak rusak', () => {
    expect(plainText('5*3 = 15 dan 2 * 4')).toBe('5*3 = 15 dan 2 * 4');
    expect(plainText('')).toBe('');
    expect(plainText(null)).toBe('');
  });
});

describe('fallback katalog (tanpa AI)', () => {
  test('buildFallbackFilter: aroma dan gender dari kata Indonesia/Inggris', () => {
    expect(buildFallbackFilter('cari yang manis dan segar buat cowok')).toEqual({ accords: ['fresh', 'sweet'], gender: 'Male' });
    expect(buildFallbackFilter('parfum vanilla untuk wanita').gender).toBe('Female');
    expect(buildFallbackFilter('halo')).toEqual({ accords: [], gender: null });
  });
  test('formatFallbackReply: daftar produk dan pesan kosong', () => {
    const out = formatFallbackReply([{ brand: 'HMNS', product_name: 'Alpha', concentration: 'Extrait', main_accords: 'Citrus', price_1ml: 12000, price_5ml: 45000 }]);
    expect(out).toMatch(/sedang sibuk/);
    expect(out).toMatch(/1\. HMNS - Alpha \(Extrait\)/);
    expect(formatFallbackReply([])).toMatch(/Belum ada produk/);
  });
});

describe('generateText: retry singkat', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());
  const RETRY = { ...OPTS, retries: 1, retryDelayMs: 1 };

  test('503 sekali lalu berhasil: model yang sama diulang, cadangan tidak dipanggil', async () => {
    let n = 0;
    const ai = aiWith({ generate: async () => { if (n++ === 0) throw apiError(503); return { text: 'ok' }; } });
    const r = await generateText(ai, RETRY);
    expect(r).toEqual({ text: 'ok', model: 'utama' });
    expect(calledModels(ai.models.generateContent)).toEqual(['utama', 'utama']);
  });
  test('503 terus: diulang satu kali lalu pindah ke model cadangan', async () => {
    const ai = aiWith({ generate: async ({ model }) => { if (model === 'utama') throw apiError(503); return { text: 'b' }; } });
    const r = await generateText(ai, RETRY);
    expect(r.model).toBe('cadangan');
    expect(calledModels(ai.models.generateContent)).toEqual(['utama', 'utama', 'cadangan']);
  });
  test('429 dan timeout tidak diulang pada model yang sama', async () => {
    const ai429 = aiWith({ generate: async ({ model }) => { if (model === 'utama') throw apiError(429); return { text: 'c' }; } });
    await generateText(ai429, RETRY);
    expect(calledModels(ai429.models.generateContent)).toEqual(['utama', 'cadangan']);
    const aiTimeout = aiWith({ generate: ({ model }) => (model === 'utama' ? new Promise(() => {}) : { text: 'd' }) });
    await generateText(aiTimeout, RETRY);
    expect(calledModels(aiTimeout.models.generateContent)).toEqual(['utama', 'cadangan']);
  });
});

describe('generateGroq: cadangan AI', () => {
  const okResp = (content) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) });

  test('mengirim system + user dan membaca teks balasan', async () => {
    const fetchImpl = jest.fn(async () => okResp('halo dari groq'));
    const r = await generateGroq({ apiKey: 'k', prompt: 'p', systemInstruction: 's', model: 'm', fetchImpl });
    expect(r).toEqual({ text: 'halo dari groq', model: 'm' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toMatch(/groq\.com/);
    expect(init.headers.Authorization).toBe('Bearer k');
    expect(JSON.parse(init.body).messages).toEqual([{ role: 'system', content: 's' }, { role: 'user', content: 'p' }]);
  });
  test('HTTP error dilempar dengan status', async () => {
    const fetchImpl = async () => ({ ok: false, status: 429, json: async () => ({}) });
    await expect(generateGroq({ apiKey: 'k', prompt: 'p', fetchImpl })).rejects.toMatchObject({ status: 429 });
  });
  test('timeout menjadi GROQ_TIMEOUT', async () => {
    const fetchImpl = (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('abort'), { name: 'AbortError' }))));
    await expect(generateGroq({ apiKey: 'k', prompt: 'p', fetchImpl, timeoutMs: 20 })).rejects.toMatchObject({ code: 'GROQ_TIMEOUT' });
  });
});
