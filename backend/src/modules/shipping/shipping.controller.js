const { getProvinces, getCities, getCost, searchDestinations } = require('../../config/rajaongkir');
const { isCourierActive } = require('../../utils/shipping');

const provinces = async (req, res) => {
  try {
    const data = await getProvinces();
    return res.status(200).json({ provinces: data });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const cities = async (req, res) => {
  try {
    const data = await getCities(req.params.provinceId);
    return res.status(200).json({ cities: data });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const cost = async (req, res) => {
  try {
    const { destination, weight = 50 } = req.body;
    const courier = String(req.body.courier || '').trim().toLowerCase();
    if (!(await isCourierActive(courier))) {
      return res.status(400).json({ message: 'Kurir tidak tersedia' });
    }
    const data = await getCost(destination, weight, courier);
    return res.status(200).json({ costs: data });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Pencarian kecamatan/kota/kode pos untuk form alamat. ID hasilnya disimpan sebagai city_id alamat.
const destinations = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 60);
    if (search.length < 3) {
      return res.status(400).json({ message: 'Ketik minimal 3 huruf nama kecamatan, kota, atau kode pos' });
    }
    const data = await searchDestinations(search);
    return res.status(200).json({ destinations: data });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { provinces, cities, cost, destinations };