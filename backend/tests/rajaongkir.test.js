// Unit test adapter RajaOngkir V2 (axios dipalsukan, tanpa database dan tanpa kuota asli).
const loadWith = (env, axiosImpl) => {
  let mod;
  const KEYS = ['RAJAONGKIR_KEY', 'RAJAONGKIR_ORIGIN_ID'];
  const saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]]));
  KEYS.forEach(k => delete process.env[k]);
  Object.assign(process.env, env);
  jest.isolateModules(() => {
    jest.doMock('axios', () => axiosImpl);
    mod = require('../src/config/rajaongkir');
  });
  KEYS.forEach(k => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; });
  return mod;
};

describe('RajaOngkir V2: mode mock (tanpa key)', () => {
  const ro = loadWith({}, { get: jest.fn(), post: jest.fn() });

  test('pencarian destinasi: minimal 3 huruf, hasil berbentuk V2', async () => {
    expect(await ro.searchDestinations('se')).toEqual([]);
    const res = await ro.searchDestinations('semarang');
    expect(res.length).toBeGreaterThan(0);
    expect(res[0]).toEqual(expect.objectContaining({ id: expect.any(Number), label: expect.stringContaining('Semarang') }));
  });
  test('getCost mock tetap memberi daftar layanan', async () => {
    expect((await ro.getCost('399', 100, 'jne')).length).toBeGreaterThan(0);
  });
});

describe('RajaOngkir V2: key asli', () => {
  const dest = { id: 1234, label: 'KEMAYORAN, JAKARTA PUSAT', province_name: 'DKI JAKARTA', city_name: 'JAKARTA PUSAT', district_name: 'KEMAYORAN', subdistrict_name: 'X', zip_code: '10610' };
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  test('cari destinasi: header key, parameter, dan hasil di-cache', async () => {
    const axios = { get: jest.fn(async () => ({ data: { data: [dest] } })), post: jest.fn() };
    const ro = loadWith({ RAJAONGKIR_KEY: 'k', RAJAONGKIR_ORIGIN_ID: '555' }, axios);
    expect((await ro.searchDestinations('Kemayoran'))[0].id).toBe(1234);
    await ro.searchDestinations('KEMAYORAN');
    expect(axios.get).toHaveBeenCalledTimes(1);
    const [url, cfg] = axios.get.mock.calls[0];
    expect(url).toBe('https://rajaongkir.komerce.id/api/v1/destination/domestic-destination');
    expect(cfg.params).toEqual({ search: 'kemayoran', limit: 20, offset: 0 });
    expect(cfg.headers.key).toBe('k');
  });

  test('getCost: kirim form-urlencoded, ubah ke bentuk lama, dan sembunyikan layanan JTR (trucking)', async () => {
    const axios = { get: jest.fn(), post: jest.fn(async () => ({ data: { data: [{ code: 'jne', service: 'JTR', description: 'Trucking', cost: 55000, etd: '3 day' }, { code: 'jne', service: 'REG', description: 'Reguler', cost: 22000, etd: '2-3 day' }, { code: 'jne', service: 'JTR>200', description: 'Trucking', cost: 1500000, etd: '3 day' }] } })) };
    const ro = loadWith({ RAJAONGKIR_KEY: 'k', RAJAONGKIR_ORIGIN_ID: '555' }, axios);
    expect(await ro.getCost('1234', 100, 'JNE')).toEqual([
      { service: 'REG', description: 'Reguler', cost: [{ value: 22000, etd: '2-3', note: '' }] }
    ]);
    const [url, body, cfg] = axios.post.mock.calls[0];
    expect(url).toBe('https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost');
    expect(body).toBe('origin=555&destination=1234&weight=100&courier=jne');
    expect(cfg.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  test('COD ditangani sendiri (ongkir 0) walau memakai key asli, tanpa memanggil API', async () => {
    const axios = { get: jest.fn(), post: jest.fn() };
    const ro = loadWith({ RAJAONGKIR_KEY: 'k', RAJAONGKIR_ORIGIN_ID: '555' }, axios);
    const out = await ro.getCost('1234', 100, 'cod');
    expect(out[0]).toMatchObject({ service: 'COD', cost: [{ value: 0 }] });
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('tanpa RAJAONGKIR_ORIGIN_ID: tidak memanggil API, hasil kosong', async () => {
    const axios = { get: jest.fn(), post: jest.fn() };
    const ro = loadWith({ RAJAONGKIR_KEY: 'k' }, axios);
    expect(await ro.getCost('1234', 100, 'jne')).toEqual([]);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('error API (400/404) menghasilkan daftar kosong, bukan exception', async () => {
    const fail = (status) => jest.fn(async () => { throw Object.assign(new Error('x'), { response: { status } }); });
    const ro = loadWith({ RAJAONGKIR_KEY: 'k', RAJAONGKIR_ORIGIN_ID: '555' }, { get: fail(404), post: fail(400) });
    expect(await ro.searchDestinations('zzzzzz')).toEqual([]);
    expect(await ro.getCost('1', 100, 'jne')).toEqual([]);
  });
});
