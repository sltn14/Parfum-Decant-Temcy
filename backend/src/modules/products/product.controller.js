const { Op } = require('sequelize');
const Product = require('./product.model');

// Get all products (dengan filter & search)
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
      where, order,
      limit: parseInt(limit),
      offset
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

// Get single product
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

// Create product (admin)
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

// Update product (admin)
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

// Delete product (admin - soft delete)
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

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };