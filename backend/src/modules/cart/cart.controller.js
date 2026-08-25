const Cart = require('./cart.model');
const CartItem = require('./cart_item.model');
const Product = require('../products/product.model');

// Helper: get price by size
const getPriceBySizeMl = (product, size_ml) => {
  const priceMap = { 1: product.price_1ml, 2: product.price_2ml, 3: product.price_3ml, 5: product.price_5ml };
  return priceMap[size_ml] || 0;
};

// Get cart
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

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { product_id, size_ml, quantity = 1 } = req.body;

    if (!product_id || !size_ml) {
      return res.status(400).json({ message: 'product_id dan size_ml wajib diisi' });
    }

    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    const price = getPriceBySizeMl(product, size_ml);
    if (!price) return res.status(400).json({ message: 'Ukuran tidak tersedia' });

    let cart = await Cart.findOne({ where: { user_id: req.user.user_id } });
    if (!cart) cart = await Cart.create({ user_id: req.user.user_id });

    // Cek apakah item sudah ada di cart
    const existingItem = await CartItem.findOne({
      where: { cart_id: cart.cart_id, product_id, size_ml }
    });

    if (existingItem) {
      await existingItem.update({ quantity: existingItem.quantity + quantity });
    } else {
      await CartItem.create({ cart_id: cart.cart_id, product_id, size_ml, quantity, price });
    }

    return res.status(200).json({ message: 'Produk berhasil ditambahkan ke keranjang' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update quantity
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await CartItem.findByPk(req.params.itemId);

    if (!item) return res.status(404).json({ message: 'Item tidak ditemukan' });

    if (quantity <= 0) {
      await item.destroy();
      return res.status(200).json({ message: 'Item dihapus dari keranjang' });
    }

    await item.update({ quantity });
    return res.status(200).json({ message: 'Keranjang berhasil diupdate' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Remove item
const removeCartItem = async (req, res) => {
  try {
    const item = await CartItem.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item tidak ditemukan' });

    await item.destroy();
    return res.status(200).json({ message: 'Item berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };