// Unit test klien API chatbot tim AI: tanpa database dan tanpa server asli (fetch dan model dipalsukan).
jest.mock('../src/utils/systemConfig', () => ({ getConfig: jest.fn() }));
const { getConfig } = require('../src/utils/systemConfig');
const { getAiTeamConfig, callAiTeamChat, enrichRecommendations, aiTeamSessionId, resetAiTeamSession, PRODUCT_CARD_FIELDS } = require('../src/modules/chatbot/aiTeamClient');

const okResp = (body) => ({ ok: true, status: 200, json: async () => body });

describe('getAiTeamConfig', () => {
  const setCfg = (map) => getConfig.mockImplementation(async (k) => map[k]);
  test('URL dan key dibersihkan (spasi, kutip, garis miring akhir)', async () => {
    setCfg({ CHATBOT_API_URL: ' "http://10.0.0.5:8000/" ', CHATBOT_API_KEY: ' "abc" ' });
    expect(await getAiTeamConfig()).toEqual({ url: 'http://10.0.0.5:8000', apiKey: 'abc' });
  });
  test('nama variabel tim mobile (AI_ENDPOINT_URL lengkap dengan /api/chat, AI_API_KEY) juga diterima', async () => {
    setCfg({ AI_ENDPOINT_URL: 'http://10.131.123.50:8000/api/chat', AI_API_KEY: 'k2' });
    expect(await getAiTeamConfig()).toEqual({ url: 'http://10.131.123.50:8000', apiKey: 'k2' });
  });
  test('CHATBOT_* didahulukan bila keduanya ada', async () => {
    setCfg({ CHATBOT_API_URL: 'http://a:1', CHATBOT_API_KEY: 'k1', AI_ENDPOINT_URL: 'http://b:2/api/chat', AI_API_KEY: 'k2' });
    expect(await getAiTeamConfig()).toEqual({ url: 'http://a:1', apiKey: 'k1' });
  });
  test('salah satu kosong: fitur nonaktif (null)', async () => {
    setCfg({ CHATBOT_API_URL: 'http://x', CHATBOT_API_KEY: '' });
    expect(await getAiTeamConfig()).toBeNull();
    setCfg({});
    expect(await getAiTeamConfig()).toBeNull();
  });
});

describe('callAiTeamChat', () => {
  const base = { url: 'http://h:8000', apiKey: 'k', sessionId: '1:s', message: 'halo' };

  test('mengirim POST /api/chat dengan X-API-Key dan membaca reply + recommendations', async () => {
    const fetchImpl = jest.fn(async () => okResp({ reply: 'hai', recommendations: [{ product_id: 1 }] }));
    const out = await callAiTeamChat({ ...base, fetchImpl });
    expect(out).toEqual({ reply: 'hai', recommendations: [{ product_id: 1 }] });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://h:8000/api/chat');
    expect(init.headers['X-API-Key']).toBe('k');
    expect(JSON.parse(init.body)).toEqual({ session_id: '1:s', message: 'halo' });
  });
  test('recommendations null menjadi array kosong', async () => {
    const out = await callAiTeamChat({ ...base, fetchImpl: async () => okResp({ reply: 'tanya dulu', recommendations: null }) });
    expect(out.recommendations).toEqual([]);
  });
  test('HTTP error membawa status; format salah ditolak', async () => {
    await expect(callAiTeamChat({ ...base, fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({}) }) })).rejects.toMatchObject({ status: 401 });
    await expect(callAiTeamChat({ ...base, fetchImpl: async () => okResp({ foo: 1 }) })).rejects.toThrow(/Format balasan/);
  });
  test('timeout menjadi AI_TEAM_TIMEOUT', async () => {
    const fetchImpl = (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('abort'), { name: 'AbortError' }))));
    await expect(callAiTeamChat({ ...base, fetchImpl, timeoutMs: 20 })).rejects.toMatchObject({ code: 'AI_TEAM_TIMEOUT' });
  });
});

describe('enrichRecommendations', () => {
  const row = (o) => ({ toJSON: () => o });
  const Model = (rows) => ({ findAll: jest.fn(async () => rows.map(row)) });

  test('mengikuti urutan API, membuang produk yang tidak ada, membulatkan persen', async () => {
    const model = Model([{ product_id: 7, brand: 'B', product_name: 'Seven' }, { product_id: 10, brand: 'A', product_name: 'Ten' }]);
    const out = await enrichRecommendations([{ product_id: 10, match_percent: 100 }, { product_id: 999, match_percent: 90 }, { product_id: 7, match_percent: 62.4 }], model);
    expect(out.map(p => [p.product_id, p.match_percent])).toEqual([[10, 100], [7, 62]]);
  });
  test('hanya produk aktif dan tanpa kolom internal (harga modal, stok)', async () => {
    const model = Model([]);
    await enrichRecommendations([{ product_id: 1 }], model);
    const args = model.findAll.mock.calls[0][0];
    expect(args.where.is_active).toBe(true);
    expect(args.attributes).toBe(PRODUCT_CARD_FIELDS);
    expect(PRODUCT_CARD_FIELDS.some(f => f === 'cost_price_per_ml' || f.startsWith('stock'))).toBe(false);
  });
  test('tanpa rekomendasi: tidak query database', async () => {
    const model = Model([]);
    expect(await enrichRecommendations(null, model)).toEqual([]);
    expect(await enrichRecommendations([{ product_id: 'abc' }], model)).toEqual([]);
    expect(model.findAll).not.toHaveBeenCalled();
  });
});

describe('session id API tim AI', () => {
  test('reset menaikkan generasi sehingga session_id berganti', () => {
    expect(aiTeamSessionId('9:x')).toBe('9:x');
    resetAiTeamSession('9:x');
    expect(aiTeamSessionId('9:x')).toBe('9:x#1');
    resetAiTeamSession('9:x');
    expect(aiTeamSessionId('9:x')).toBe('9:x#2');
    expect(aiTeamSessionId('9:other')).toBe('9:other');
  });
});
