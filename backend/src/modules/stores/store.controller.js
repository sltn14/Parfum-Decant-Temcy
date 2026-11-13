const Store = require('./store.model');
const { audit, pickKeys, changes } = require('../../utils/audit');

const STORE_FIELDS = ['name', 'city', 'address', 'phone', 'maps_url', 'is_active'];

const pickFields = (body) => {
  const { name, city, address, phone, maps_url } = body;
  return {
    name: (name || '').trim(),
    city: (city || '').trim(),
    address: (address || '').trim(),
    phone: phone ? String(phone).trim() : null,
    maps_url: maps_url ? String(maps_url).trim() : null
  };
};

// Publik: daftar store aktif (dipakai checkout pickup)
const getActiveStores = async (req, res) => {
  try {
    const stores = await Store.findAll({
      where: { is_active: true },
      order: [['city', 'ASC'], ['name', 'ASC']]
    });
    return res.status(200).json({ stores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin: semua store (termasuk nonaktif)
const getAllStores = async (req, res) => {
  try {
    const stores = await Store.findAll({ order: [['city', 'ASC'], ['name', 'ASC']] });
    return res.status(200).json({ stores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const createStore = async (req, res) => {
  try {
    const data = pickFields(req.body);
    if (!data.name || !data.city || !data.address) {
      return res.status(400).json({ message: 'Nama, kota, dan alamat store wajib diisi' });
    }
    const store = await Store.create({ ...data, is_active: true });
    await audit(req, { action: 'create', entity: 'store', entityId: store.store_id,
      message: `Cabang ditambahkan: ${store.name}`, after: pickKeys(store, STORE_FIELDS) });
    return res.status(201).json({ message: 'Store berhasil ditambahkan', store });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store tidak ditemukan' });

    const data = pickFields(req.body);
    if (!data.name || !data.city || !data.address) {
      return res.status(400).json({ message: 'Nama, kota, dan alamat store wajib diisi' });
    }
    const beforeSnap = pickKeys(store, STORE_FIELDS);
    await store.update(data);
    await audit(req, { action: 'update', entity: 'store', entityId: store.store_id,
      message: `Cabang diubah: ${store.name}`, ...changes(beforeSnap, pickKeys(store, STORE_FIELDS)) });
    return res.status(200).json({ message: 'Store berhasil diupdate', store });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Aktif / nonaktifkan store (store nonaktif tidak muncul di checkout)
const toggleStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store tidak ditemukan' });

    // Jangan sampai semua store nonaktif: pickup tidak akan bisa dipakai
    if (store.is_active) {
      const activeCount = await Store.count({ where: { is_active: true } });
      if (activeCount <= 1) {
        return res.status(400).json({ message: 'Minimal harus ada satu store aktif untuk pickup' });
      }
    }

    const wasActive = store.is_active;
    await store.update({ is_active: !store.is_active });
    await audit(req, { action: 'toggle', entity: 'store', entityId: store.store_id,
      message: `Cabang ${store.is_active ? 'diaktifkan' : 'dinonaktifkan'}: ${store.name}`,
      before: { is_active: wasActive }, after: { is_active: store.is_active } });
    return res.status(200).json({
      message: `Store berhasil ${store.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
      store
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getActiveStores, getAllStores, createStore, updateStore, toggleStore };
