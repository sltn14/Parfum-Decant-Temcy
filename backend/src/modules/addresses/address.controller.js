const Address = require('./address.model');

const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { user_id: req.user.user_id },
      order: [['is_default', 'DESC'], ['createdAt', 'DESC']]
    });
    return res.status(200).json({ addresses });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const createAddress = async (req, res) => {
  try {
    const { label, recipient_name, phone, province, province_id, city, city_id, district, postal_code, detail, is_default } = req.body;

    if (is_default) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.user_id } });
    }

    const address = await Address.create({
      user_id: req.user.user_id,
      label, recipient_name, phone, province, province_id,
      city, city_id, district, postal_code, detail,
      is_default: is_default || false
    });
    return res.status(201).json({ message: 'Alamat berhasil ditambahkan', address });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { address_id: req.params.id, user_id: req.user.user_id }
    });
    if (!address) return res.status(404).json({ message: 'Alamat tidak ditemukan' });

    if (req.body.is_default) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.user_id } });
    }

    await address.update(req.body);
    return res.status(200).json({ message: 'Alamat berhasil diupdate', address });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { address_id: req.params.id, user_id: req.user.user_id }
    });
    if (!address) return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    await address.destroy();
    return res.status(200).json({ message: 'Alamat berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    await Address.update({ is_default: false }, { where: { user_id: req.user.user_id } });
    await Address.update({ is_default: true }, {
      where: { address_id: req.params.id, user_id: req.user.user_id }
    });
    return res.status(200).json({ message: 'Alamat default berhasil diubah' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress };