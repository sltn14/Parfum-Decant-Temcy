const Cart = require('./cart.model');
const CartItem = require('./cart_item.model');
const Product = require('../products/product.model');
const { SIZES, maxQtyForSize, mlNeeded } = require('../../utils/stockMl');
const { Op } = require('sequelize');

const getPriceBySizeMl = (product, size_ml) => {
  const priceMap = { 1: product.price_1ml, 2: product.price_2ml, 3: product.price_3ml, 5: product.price_5ml, 10: product.price_10ml };
  return priceMap[size_ml] || 0;
};

// Sisa pcs yang boleh dibeli untuk ukuran ini: sisa ml botol besar dikurangi ml yang sudah
// dipakai item LAIN (ukuran lain / produk sama) di keranjang, dibagi ukuran.
const getAvailableQty = async (product, cartId, size_ml, excludeItemId = null) => {
  const where = { cart_id: cartId, product_id: product.product_id };
  if (excludeItemId) where.cart_item_id = { [Op.ne]: excludeItemId };
  const others = await CartItem.findAll({ where });
  const remaining = (Number(product.stock_ml) || 0) - mlNeeded(others);
  return maxQtyForSize(remaining, size_ml);
};

const stockMessage = (product, size_ml, available) =>
  available <= 0
    ? `Stok ${product.product_name} tidak cukup untuk ukuran ${size_ml}ml (sisa ${Number(product.stock_ml) || 0} ml)`
    : `Jumlah melebihi stok. Untuk ukuran ${size_ml}ml masih bisa dibeli maksimal ${available} pcs`;

// Item keranjang hanya boleh diakses pemilik keranjangnya. Item milik orang lain diperlakukan
// sama seperti tidak ada (null -> 404), sehingga keberadaannya tidak bocor.
const MAX_QTY_PER_ITEM = 99;
const findOwnItem = async (userId, itemId) => {
  const id = parseInt(itemId);
  if (!Number.isInteger(id)) return null;
  const cart = await Cart.findOne({ where: { user_id: userId } });
  if (!cart) return null;
  return CartItem.findOne({ where: { cart_item_id: id, cart_id: cart.cart_id } });
};

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      where: { user_id: req.user.user_id },
      include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
    });
    if (!cart) cart = await Cart.create({ user_id: req.user.user_id });
    return res.status(200).json({ cart });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Add to cart — validasi sisa ml botol besar
const addToCart = async (req, res) => {
  try {
    let { product_id, size_ml, quantity = 1 } = req.body;

    if (!product_id || !size_ml) {
      return res.status(400).json({ message: 'product_id dan size_ml wajib diisi' });
    }

    // Normalisasi dan validasi: ukuran harus salah satu dari 1/2/3/5/10 ml, jumlah bilangan bulat >= 1
    // (jumlah negatif/pecahan akan merusak subtotal dan stok)
    size_ml = parseInt(size_ml);
    quantity = Number(quantity);
    if (!SIZES.includes(size_ml)) {
      return res.status(400).json({ message: 'Ukuran tidak valid' });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Jumlah harus bilangan bulat minimal 1' });
    }

    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    if (!product.is_active) return res.status(400).json({ message: 'Produk tidak tersedia' });

    const price = getPriceBySizeMl(product, size_ml);
    if (!price) return res.status(400).json({ message: 'Ukuran tidak tersedia' });

    let cart = await Cart.findOne({ where: { user_id: req.user.user_id } });
    if (!cart) cart = await Cart.create({ user_id: req.user.user_id });

    // Cek apakah item sudah ada di cart
    const existingItem = await CartItem.findOne({
      where: { cart_id: cart.cart_id, product_id, size_ml }
    });

    // Validasi sisa ml botol besar (item ukuran yang sama dihitung ulang dengan qty barunya)
    const availableQty = await getAvailableQty(product, cart.cart_id, size_ml, existingItem?.cart_item_id);
    const newQty = (existingItem ? existingItem.quantity : 0) + quantity;
    if (newQty > availableQty) {
      return res.status(400).json({ message: stockMessage(product, size_ml, availableQty) });
    }

    if (existingItem) {
      await existingItem.update({ quantity: newQty });
    } else {
      await CartItem.create({ cart_id: cart.cart_id, product_id, size_ml, quantity, price });
    }

    return res.status(200).json({ message: 'Produk berhasil ditambahkan ke keranjang' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update quantity — validasi sisa ml botol besar
const updateCartItem = async (req, res) => {
  try {
    let { quantity } = req.body;
    quantity = Number(quantity);
    if (!Number.isInteger(quantity)) {
      return res.status(400).json({ message: 'Jumlah harus bilangan bulat' });
    }

    const item = await findOwnItem(req.user.user_id, req.params.itemId);

    if (!item) return res.status(404).json({ message: 'Item tidak ditemukan' });

    if (quantity > MAX_QTY_PER_ITEM) {
      return res.status(400).json({ message: `Maksimal ${MAX_QTY_PER_ITEM} pcs per item` });
    }

    if (quantity <= 0) {
      await item.destroy();
      return res.status(200).json({ message: 'Item dihapus dari keranjang' });
    }

    // Explicit query product — tidak pakai include agar tidak bergantung alias
    const product = await Product.findByPk(item.product_id);
    if (product) {
      const availableQty = await getAvailableQty(product, item.cart_id, item.size_ml, item.cart_item_id);
      if (quantity > availableQty) {
        return res.status(400).json({ message: stockMessage(product, item.size_ml, availableQty) });
      }
    }

    await item.update({ quantity });
    return res.status(200).json({ message: 'Keranjang berhasil diupdate' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const item = await findOwnItem(req.user.user_id, req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item tidak ditemukan' });
    await item.destroy();
    return res.status(200).json({ message: 'Item berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };