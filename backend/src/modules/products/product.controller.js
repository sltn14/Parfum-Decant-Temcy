const { Op } = require('sequelize');
const Product = require('./product.model');

const getProducts = async (req, res) => {
  try {
    const {
      search, gender, concentration, main_accords,
      min_price, max_price, sort, page = 1, limit = 12
    } = req.query;

    const where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { product_name: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { main_accords: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (gender) where.gender = gender;
    if (concentration) where.concentration = concentration;
    if (main_accords) where.main_accords = { [Op.iLike]: `%${main_accords}%` };
    if (min_price) where.price_1ml = { [Op.gte]: parseInt(min_price) };
    if (max_price) where.price_1ml = { ...where.price_1ml, [Op.lte]: parseInt(max_price) };

    const order = [];
    if (sort === 'terlaris') order.push(['sold_count', 'DESC']);
    else if (sort === 'termurah') order.push(['price_1ml', 'ASC']);
    else if (sort === 'termahal') order.push(['price_1ml', 'DESC']);
    else order.push(['createdAt', 'DESC']);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Product.findAndCountAll({
      where, order, limit: parseInt(limit), offset
    });

    return res.status(200).json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      products: rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { product_id: req.params.id, is_active: true }
    });
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    return res.status(200).json({ product });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      image_filename: req.file ? req.file.filename : 'default.png'
    });
    return res.status(201).json({ message: 'Produk berhasil ditambahkan', product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    await product.update({
      ...req.body,
      ...(req.file && { image_filename: req.file.filename })
    });
    return res.status(200).json({ message: 'Produk berhasil diupdate', product });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    await product.update({ is_active: false });
    return res.status(200).json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update stok per ukuran botol
const updateStock = async (req, res) => {
  try {
    const { stock_1ml, stock_2ml, stock_3ml, stock_5ml } = req.body;

    // Validasi: minimal satu ukuran harus diisi
    const hasAny = [stock_1ml, stock_2ml, stock_3ml, stock_5ml].some(v => v !== undefined && v !== null);
    if (!hasAny) {
      return res.status(400).json({ message: 'Minimal satu ukuran stok harus diisi' });
    }

    const updates = {};
    if (stock_1ml !== undefined && stock_1ml !== null) {
      if (isNaN(stock_1ml) || parseInt(stock_1ml) < 0) return res.status(400).json({ message: 'Stok 1ml tidak valid' });
      updates.stock_1ml = parseInt(stock_1ml);
    }
    if (stock_2ml !== undefined && stock_2ml !== null) {
      if (isNaN(stock_2ml) || parseInt(stock_2ml) < 0) return res.status(400).json({ message: 'Stok 2ml tidak valid' });
      updates.stock_2ml = parseInt(stock_2ml);
    }
    if (stock_3ml !== undefined && stock_3ml !== null) {
      if (isNaN(stock_3ml) || parseInt(stock_3ml) < 0) return res.status(400).json({ message: 'Stok 3ml tidak valid' });
      updates.stock_3ml = parseInt(stock_3ml);
    }
    if (stock_5ml !== undefined && stock_5ml !== null) {
      if (isNaN(stock_5ml) || parseInt(stock_5ml) < 0) return res.status(400).json({ message: 'Stok 5ml tidak valid' });
      updates.stock_5ml = parseInt(stock_5ml);
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    // stock_ml otomatis = total ml dari semua vial (Inventaris jadi sumber utama)
    const { mlFields } = require('../../utils/stockMl');
    Object.assign(updates, mlFields({ ...product.get(), ...updates }, product.stock_ml_initial));

    await product.update(updates);
    return res.status(200).json({ message: 'Stok berhasil diperbarui', product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAllProductsAdmin = async (req, res) => {
  try {
    const { search, page = 1, limit = 15 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { product_name: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Product.findAndCountAll({
      where,
      order: [['brand', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    // Hitung summary dari SEMUA produk
    const allProducts = await Product.findAll({
      where,
      attributes: ['stock_1ml', 'stock_2ml', 'stock_3ml', 'stock_5ml']
    });

    const summary = {
      habis: allProducts.filter(p => {
        return p.stock_1ml <= 0 && p.stock_2ml <= 0 && p.stock_3ml <= 0 && p.stock_5ml <= 0;
      }).length,
      menipis: allProducts.filter(p => {
        const total = p.stock_1ml + p.stock_2ml + p.stock_3ml + p.stock_5ml;
        return total > 0 && total <= 10;
      }).length,
      aman: allProducts.filter(p => {
        const total = p.stock_1ml + p.stock_2ml + p.stock_3ml + p.stock_5ml;
        return total > 10;
      }).length
    };

    return res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      products: rows,
      summary
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts, getProduct, createProduct,
  updateProduct, deleteProduct, updateStock, getAllProductsAdmin
};