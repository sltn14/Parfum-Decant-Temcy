const Favorite = require('./favorite.model');
const Product = require('../products/product.model');

const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.findAll({
      where: { user_id: req.user.user_id },
      include: [{ model: Product, as: 'product' }],
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ favorites });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const raw = req.body.product_id;
    const product_id = typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw)) ? Number(raw) : NaN;
    if (!Number.isInteger(product_id) || product_id < 1) {
      return res.status(400).json({ message: 'product_id tidak valid' });
    }
    const existing = await Favorite.findOne({
      where: { user_id: req.user.user_id, product_id }
    });
    // Favorit lama tetap boleh dihapus walau produknya sudah nonaktif
    if (existing) {
      await existing.destroy();
      return res.status(200).json({ message: 'Dihapus dari favorit', is_favorite: false });
    }
    const product = await Product.findOne({ where: { product_id, is_active: true } });
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    await Favorite.create({ user_id: req.user.user_id, product_id });
    return res.status(200).json({ message: 'Ditambahkan ke favorit', is_favorite: true });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const existing = await Favorite.findOne({
      where: { user_id: req.user.user_id, product_id: req.params.productId }
    });
    return res.status(200).json({ is_favorite: !!existing });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getFavorites, toggleFavorite, checkFavorite };