const { getCost } = require('../config/rajaongkir');
const Courier = require('../modules/couriers/courier.model');

// Kurir cadangan bila tabel couriers belum dibuat (migration belum dijalankan). 'cod' ditangani sendiri: ongkir 0.
const COURIERS = Courier.DEFAULTS.map(c => c.code);

// Kurir hanya boleh dipakai bila ada di tabel couriers dan aktif (diatur admin)
const isCourierActive = async (code) => {
  try {
    return !!(await Courier.findOne({ where: { code, is_active: true }, attributes: ['courier_id'] }));
  } catch (err) {
    if (err?.parent?.code === '42P01') { // relation "couriers" does not exist
      console.warn('Tabel couriers belum ada, memakai daftar kurir bawaan. Jalankan migration_add_couriers.sql');
      return COURIERS.includes(code);
    }
    throw err;
  }
};
// Berat per botol decant (gram), sama dengan perhitungan di frontend (50 g x jumlah item)
const WEIGHT_PER_ITEM_G = 50;
const VALID_SIZES = [1, 2, 3, 5, 10];

class ShippingError extends Error {}

// Hitung ongkir di SERVER. Nilai shipping_cost dari klien tidak pernah dipercaya.
// Mengembalikan { courier, service, cost }. Melempar ShippingError (pesan siap tampil) bila tidak valid.
//   address : alamat tersimpan (punya city_id) atau null untuk alamat manual
//   weight  : gram, dihitung dari isi keranjang
const calculateShipping = async ({ courier, courierService, address, weight }) => {
  const c = String(courier || '').toLowerCase();
  if (!(await isCourierActive(c))) throw new ShippingError('Kurir tidak tersedia');

  if (c === 'cod') return { courier: 'cod', service: 'COD', cost: 0 };

  // Kurir non-COD butuh kota tujuan dari alamat tersimpan (alamat manual tidak punya city_id)
  if (!address || !address.city_id) {
    throw new ShippingError('Pilih alamat tersimpan dengan kota yang valid untuk kurir ini, atau gunakan COD');
  }
  if (!courierService) throw new ShippingError('Pilih layanan pengiriman');

  const services = await getCost(address.city_id, Math.max(1, weight), c);
  const match = (services || []).find(s => String(s.service).toLowerCase() === String(courierService).toLowerCase());
  const cost = match ? Number(match.cost?.[0]?.value) : NaN;
  if (!match || !Number.isFinite(cost) || cost < 0) {
    throw new ShippingError('Layanan pengiriman tidak tersedia untuk tujuan ini');
  }
  return { courier: c, service: match.service, cost: Math.round(cost) };
};

// Berat total (gram) dari item keranjang
const cartWeight = (items) => items.reduce((sum, i) => sum + WEIGHT_PER_ITEM_G * (parseInt(i.quantity) || 0), 0);

module.exports = { COURIERS, isCourierActive, VALID_SIZES, WEIGHT_PER_ITEM_G, ShippingError, calculateShipping, cartWeight };
