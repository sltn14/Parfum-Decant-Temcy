const Store = require('./store.model');

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
    await store.update(data);
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

    await store.update({ is_active: !store.is_active });
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