const Courier = require('./courier.model');
const { Op } = require('sequelize');
const { audit, pickKeys } = require('../../utils/audit');

const COURIER_FIELDS = ['code', 'name', 'is_active', 'sort_order'];
const CODE_RE = /^[a-z0-9]{2,30}$/;
const ORDER = [['sort_order', 'ASC'], ['courier_id', 'ASC']];

// Publik (checkout): hanya kurir aktif
const getActiveCouriers = async (req, res) => {
  try {
    const couriers = await Courier.findAll({ where: { is_active: true }, attributes: ['code', 'name'], order: ORDER });
    return res.status(200).json({ couriers });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAllCouriers = async (req, res) => {
  try {
    return res.status(200).json({ couriers: await Courier.findAll({ order: ORDER }) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const createCourier = async (req, res) => {
  try {
    // Hanya teks yang diterima (angka/objek dari klien dianggap tidak valid)
    const code = typeof req.body.code === 'string' ? req.body.code.trim().toLowerCase() : '';
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!CODE_RE.test(code)) {
      return res.status(400).json({ message: 'Kode kurir 2-30 karakter, hanya huruf kecil dan angka (sesuai kode RajaOngkir, mis. jne, anteraja)' });
    }
    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ message: 'Nama kurir 2-60 karakter' });
    }
    if (await Courier.findOne({ where: { code } })) {
      return res.status(409).json({ message: 'Kode kurir sudah ada' });
    }
    const max = await Courier.max('sort_order');
    const courier = await Courier.create({ code, name, is_active: true, sort_order: (Number.isFinite(max) ? max : 0) + 1 });
    await audit(req, {
      action: 'create_courier', entity: 'courier', entityId: courier.courier_id,
      message: `Kurir ${name} (${code}) ditambahkan`, after: pickKeys(courier, COURIER_FIELDS)
    });
    return res.status(201).json({ message: 'Kurir ditambahkan', courier });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateCourier = async (req, res) => {
  try {
    const courier = await Courier.findByPk(parseInt(req.params.id));
    if (!courier) return res.status(404).json({ message: 'Kurir tidak ditemukan' });

    const before = pickKeys(courier, COURIER_FIELDS);
    const updates = {};
    if (req.body.code !== undefined) {
      const code = typeof req.body.code === 'string' ? req.body.code.trim().toLowerCase() : '';
      if (!CODE_RE.test(code)) {
        return res.status(400).json({ message: 'Kode kurir 2-30 karakter, hanya huruf kecil dan angka (sesuai kode RajaOngkir, mis. jne, anteraja)' });
      }
      if (code !== courier.code) {
        // Kode "cod" berarti diantar owner (ongkir 0): tidak boleh dipindahkan ke atau dari kurir lain
        if (courier.code === 'cod' || code === 'cod') {
          return res.status(400).json({ message: 'Kode "cod" khusus untuk COD dan tidak bisa diubah atau dipakai kurir lain' });
        }
        if (await Courier.findOne({ where: { code, courier_id: { [Op.ne]: courier.courier_id } } })) {
          return res.status(409).json({ message: 'Kode kurir sudah ada' });
        }
        updates.code = code;
      }
    }
    if (req.body.name !== undefined) {
      const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
      if (name.length < 2 || name.length > 60) return res.status(400).json({ message: 'Nama kurir 2-60 karakter' });
      updates.name = name;
    }
    if (req.body.is_active !== undefined) {
      if (typeof req.body.is_active !== 'boolean') return res.status(400).json({ message: 'is_active harus true atau false' });
      updates.is_active = req.body.is_active;
    }
    if (req.body.sort_order !== undefined) {
      const n = Number(req.body.sort_order);
      if (!Number.isInteger(n) || n < 0 || n > 9999) return res.status(400).json({ message: 'Urutan tidak valid' });
      updates.sort_order = n;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'Tidak ada perubahan' });

    await courier.update(updates);
    await audit(req, {
      action: 'update_courier', entity: 'courier', entityId: courier.courier_id,
      message: `Kurir ${courier.name} (${courier.code}) diubah`, before, after: pickKeys(courier, COURIER_FIELDS)
    });
    return res.status(200).json({ message: 'Kurir diperbarui', courier });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Pesanan lama menyimpan nama kurir sebagai teks (bukan relasi), jadi menghapus kurir tidak merusak riwayat pesanan
const deleteCourier = async (req, res) => {
  try {
    const courier = await Courier.findByPk(parseInt(req.params.id));
    if (!courier) return res.status(404).json({ message: 'Kurir tidak ditemukan' });
    const before = pickKeys(courier, COURIER_FIELDS);
    await courier.destroy();
    await audit(req, {
      action: 'delete_courier', entity: 'courier', entityId: courier.courier_id,
      message: `Kurir ${before.name} (${before.code}) dihapus`, before
    });
    return res.status(200).json({ message: 'Kurir dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getActiveCouriers, getAllCouriers, createCourier, updateCourier, deleteCourier };
