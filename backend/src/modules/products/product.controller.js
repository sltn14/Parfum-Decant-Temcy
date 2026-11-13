const { Op } = require('sequelize');
const Product = require('./product.model');
const { mlFields } = require('../../utils/stockMl');
const sequelize = require('../../config/database');
const { audit, pickKeys, changes } = require('../../utils/audit');

// Whitelist field yang boleh diubah admin lewat create/update produk.
// stock_ml (di update), stock_*ml (data lama), sold_count, product_id, image_filename sengaja tidak ada:
// stok hanya berubah lewat Inventaris/checkout, sold_count hanya lewat checkout.
const PRODUCT_FIELDS = [
  'brand', 'product_name', 'concentration', 'inspirator', 'gender',
  'top_notes', 'middle_notes', 'base_notes', 'main_accords',
  'longevity_hours', 'longevity_display', 'pros', 'cons', 'characteristic', 'description',
  'cost_price_per_ml', 'price_1ml', 'price_2ml', 'price_3ml', 'price_5ml', 'price_10ml',
  'weight_g', 'is_active', 'stock_ml_initial'
];

const pick = (body = {}, keys) => {
  const out = {};
  for (const k of keys) if (body[k] !== undefined) out[k] = body[k];
  return out;
};

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

// Daftar aroma utama unik (produk aktif) untuk chip filter katalog.
// main_accords berisi daftar dipisah koma/titik koma, mis. "Woody, Warm Spicy".
const getAccords = async (req, res) => {
  try {
    const rows = await Product.findAll({
      where: { is_active: true, main_accords: { [Op.ne]: null } },
      attributes: ['main_accords'],
      raw: true
    });
    const seen = new Map(); // huruf kecil -> tampilan pertama (tanpa duplikat beda kapitalisasi)
    for (const r of rows) {
      String(r.main_accords).split(/[,;]/).map(a => a.trim()).filter(Boolean).forEach(a => {
        if (!seen.has(a.toLowerCase())) seen.set(a.toLowerCase(), a);
      });
    }
    const accords = [...seen.values()].sort((a, b) => a.localeCompare(b, 'id'));
    return res.status(200).json({ accords });
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
    const data = pick(req.body, PRODUCT_FIELDS);
    // Stok awal = sisa ml botol besar (opsional, default 0)
    const stockMl = req.body.stock_ml === undefined || req.body.stock_ml === '' ? 0 : Number(req.body.stock_ml);
    if (!Number.isFinite(stockMl) || stockMl < 0) {
      return res.status(400).json({ message: 'Stok (ml) tidak valid' });
    }
    const product = await Product.create({
      ...data,
      ...mlFields(stockMl, data.stock_ml_initial),
      image_filename: req.file ? req.file.filename : 'default.png'
    });
    await audit(req, { action: 'create', entity: 'product', entityId: product.product_id,
      message: `Produk ditambahkan: ${product.brand} ${product.product_name}`,
      after: pickKeys(product, [...PRODUCT_FIELDS, 'stock_ml']) });
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
    const keys = [...PRODUCT_FIELDS, 'image_filename'];
    const beforeSnap = pickKeys(product, keys);
    await product.update({
      ...pick(req.body, PRODUCT_FIELDS),
      ...(req.file && { image_filename: req.file.filename })
    });
    await audit(req, { action: 'update', entity: 'product', entityId: product.product_id,
      message: `Produk diubah: ${product.brand} ${product.product_name}`,
      ...changes(beforeSnap, pickKeys(product, keys)) });
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
    await audit(req, { action: 'deactivate', entity: 'product', entityId: product.product_id,
      message: `Produk dinonaktifkan: ${product.brand} ${product.product_name}`,
      before: { is_active: true }, after: { is_active: false } });
    return res.status(200).json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update stok = sisa ml botol besar
const updateStock = async (req, res) => {
  try {
    const raw = req.body.stock_ml;
    if (raw === undefined || raw === null || raw === '') {
      return res.status(400).json({ message: 'Stok (ml) wajib diisi' });
    }
    const stockMl = Number(raw);
    if (!Number.isFinite(stockMl) || stockMl < 0 || stockMl > 100000) {
      return res.status(400).json({ message: 'Stok (ml) tidak valid' });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    const updates = mlFields(Math.round(stockMl * 10) / 10, product.stock_ml_initial);

    const stockKeys = ['stock_ml', 'stock_ml_initial'];
    const beforeStock = pickKeys(product, stockKeys);
    await product.update(updates);
    await audit(req, { action: 'update_stock', entity: 'product', entityId: product.product_id,
      message: `Stok diubah: ${product.brand} ${product.product_name}`,
      ...changes(beforeStock, pickKeys(product, stockKeys)) });
    return res.status(200).json({ message: 'Stok berhasil diperbarui', product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Batas menipis dalam ml (sisa botol besar)
const STOCK_LOW_THRESHOLD = 20;
const ML_SQL = `COALESCE("stock_ml",0)`;

// Kondisi SQL per status stok (aturan sama dengan summary di bawah)
const stockStatusCondition = (status) => {
  switch (status) {
    case 'habis':   return sequelize.literal(`${ML_SQL} <= 0`);
    case 'menipis': return sequelize.literal(`${ML_SQL} > 0 AND ${ML_SQL} <= ${STOCK_LOW_THRESHOLD}`);
    case 'restock': return sequelize.literal(`${ML_SQL} <= ${STOCK_LOW_THRESHOLD}`); // habis + menipis
    case 'aman':    return sequelize.literal(`${ML_SQL} > ${STOCK_LOW_THRESHOLD}`);
    default:        return null;
  }
};

const getAllProductsAdmin = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 15 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { product_name: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // where tanpa status dipakai untuk summary (tetap global untuk hasil pencarian);
    // filter status hanya menyaring daftar, SEBELUM paginasi
    const summaryWhere = where;
    const statusCond = stockStatusCondition(status);
    const listWhere = statusCond ? { [Op.and]: [where, statusCond] } : where;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Product.findAndCountAll({
      where: listWhere,
      order: [['brand', 'ASC'], ['product_id', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    // Hitung summary dari SEMUA produk
    const allProducts = await Product.findAll({
      where: summaryWhere,
      attributes: ['stock_ml']
    });
    const ml = (p) => Number(p.stock_ml) || 0;

    const summary = {
      habis: allProducts.filter(p => ml(p) <= 0).length,
      menipis: allProducts.filter(p => ml(p) > 0 && ml(p) <= STOCK_LOW_THRESHOLD).length,
      aman: allProducts.filter(p => ml(p) > STOCK_LOW_THRESHOLD).length
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
  getProducts, getProduct, getAccords, createProduct,
  updateProduct, deleteProduct, updateStock, getAllProductsAdmin
};