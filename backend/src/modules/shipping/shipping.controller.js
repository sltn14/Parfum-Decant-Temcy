const { getProvinces, getCities, getCost } = require('../../config/rajaongkir');

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
    const { destination, weight = 50, courier } = req.body;
    const data = await getCost(destination, weight, courier);
    return res.status(200).json({ costs: data });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { provinces, cities, cost };