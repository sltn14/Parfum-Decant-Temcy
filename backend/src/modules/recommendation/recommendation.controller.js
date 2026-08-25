const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const OrderItem = require('../orders/order_item.model');
const { Op } = require('sequelize');
const sequelize = require('../../config/database');

// Rekomendasi produk terlaris
const getPopular = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { is_active: true },
      order: [['sold_count', 'DESC']],
      limit: 8
    });
    return res.status(200).json({ products });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Rekomendasi berdasarkan gender
const getByGender = async (req, res) => {
  try {
    const { gender } = req.params;
    const validGender = ['Male', 'Female', 'Unisex'];

    if (!validGender.includes(gender)) {
      return res.status(400).json({ message: 'Gender tidak valid' });
    }

    const products = await Product.findAll({
      where: {
        is_active: true,
        gender: { [Op.in]: [gender, 'Unisex'] }
      },
      order: [['sold_count', 'DESC']],
      limit: 8
    });

    return res.status(200).json({ products });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Rekomendasi berdasarkan accords (mirip produk yang dilihat)
const getSimilar = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    // Ambil accord pertama sebagai basis
    const mainAccord = product.main_accords?.split(',')[0]?.trim();

    const similar = await Product.findAll({
      where: {
        is_active: true,
        product_id: { [Op.ne]: product.product_id },
        ...(mainAccord && {
          main_accords: { [Op.iLike]: `%${mainAccord}%` }
        })
      },
      order: [['sold_count', 'DESC']],
      limit: 6
    });

    return res.status(200).json({ products: similar });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Rekomendasi berdasarkan riwayat order user
const getPersonalized = async (req, res) => {
  try {
    const User = require('../auth/user.model');
    const user = await User.findByPk(req.user.user_id);

    const { Op } = require('sequelize');
    const where = { is_active: true };

    // Pakai preferensi user kalau ada
    if (user.pref_gender) {
      where.gender = { [Op.in]: [user.pref_gender, 'Unisex'] };
    }
    if (user.pref_aroma) {
      where.main_accords = { [Op.iLike]: `%${user.pref_aroma}%` };
    }

    // Ambil produk yang pernah dibeli
    const userOrders = await OrderItem.findAll({
      include: [{ model: Order, where: { user_id: req.user.user_id } }],
      attributes: ['product_id']
    });

    const boughtProductIds = userOrders.map(item => item.product_id);
    if (boughtProductIds.length > 0) {
      where.product_id = { [Op.notIn]: boughtProductIds };
    }

    const recommended = await Product.findAll({
      where,
      order: [['sold_count', 'DESC']],
      limit: 8
    });

    // Fallback ke popular kalau hasil kosong
    if (recommended.length === 0) {
      const popular = await Product.findAll({
        where: { is_active: true },
        order: [['sold_count', 'DESC']],
        limit: 8
      });
      return res.status(200).json({ products: popular, type: 'popular' });
    }

    return res.status(200).json({
      products: recommended,
      type: 'personalized',
      based_on: { gender: user.pref_gender, aroma: user.pref_aroma }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Rekomendasi berdasarkan concentration
const getByConcentration = async (req, res) => {
  try {
    const { concentration } = req.params;

    const products = await Product.findAll({
      where: { is_active: true, concentration },
      order: [['sold_count', 'DESC']],
      limit: 8
    });

    return res.status(200).json({ products });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPopular, getByGender, getSimilar, getPersonalized, getByConcentration };