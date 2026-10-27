const Cart = require('./cart.model');
const CartItem = require('./cart_item.model');
const Product = require('../products/product.model');

const getPriceBySizeMl = (product, size_ml) => {
  const priceMap = { 1: product.price_1ml, 2: product.price_2ml, 3: product.price_3ml, 5: product.price_5ml };
  return priceMap[size_ml] || 0;
};

// Helper: ambil stok berdasarkan ukuran
const getStockBySize = (product, size_ml) => {
  const stockMap = { 1: product.stock_1ml, 2: product.stock_2ml, 3: product.stock_3ml, 5: product.stock_5ml };
  return stockMap[size_ml] ?? 0;
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

// Add to cart — validasi stok per ukuran botol
const addToCart = async (req, res) => {
  try {
    const { product_id, size_ml, quantity = 1 } = req.body;

    if (!product_id || !size_ml) {
      return res.status(400).json({ message: 'product_id dan size_ml wajib diisi' });
    }

    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    if (!product.is_active) return res.status(400).json({ message: 'Produk tidak tersedia' });

    const price = getPriceBySizeMl(product, size_ml);
    if (!price) return res.status(400).json({ message: 'Ukuran tidak tersedia' });

    // Validasi stok per ukuran botol
    const availableStock = getStockBySize(product, size_ml);
    if (availableStock <= 0) {
      return res.status(400).json({ message: `Stok botol ${size_ml}ml habis` });
    }

    let cart = await Cart.findOne({ where: { user_id: req.user.user_id } });
    if (!cart) cart = await Cart.create({ user_id: req.user.user_id });

    // Cek apakah item sudah ada di cart
    const existingItem = await CartItem.findOne({
      where: { cart_id: cart.cart_id, product_id, size_ml }
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > availableStock) {
        return res.status(400).json({
          message: `Jumlah melebihi stok. Stok botol ${size_ml}ml tersedia: ${availableStock} pcs`
        });
      }
      await existingItem.update({ quantity: newQty });
    } else {
      if (quantity > availableStock) {
        return res.status(400).json({
          message: `Jumlah melebihi stok. Stok botol ${size_ml}ml tersedia: ${availableStock} pcs`
        });
      }
      await CartItem.create({ cart_id: cart.cart_id, product_id, size_ml, quantity, price });
    }

    return res.status(200).json({ message: 'Produk berhasil ditambahkan ke keranjang' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update quantity — validasi stok per ukuran botol
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    const item = await CartItem.findOne({
      where: { cart_item_id: req.params.itemId }
    });

    if (!item) return res.status(404).json({ message: 'Item tidak ditemukan' });

    if (quantity <= 0) {
      await item.destroy();
      return res.status(200).json({ message: 'Item dihapus dari keranjang' });
    }

    // Explicit query product — tidak pakai include agar tidak bergantung alias
    const product = await Product.findByPk(item.product_id);
    if (product) {
      const availableStock = getStockBySize(product, item.size_ml);
      if (quantity > availableStock) {
        return res.status(400).json({
          message: `Jumlah melebihi stok. Stok botol ${item.size_ml}ml tersedia: ${availableStock} pcs`
        });
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
    const item = await CartItem.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item tidak ditemukan' });
    await item.destroy();
    return res.status(200).json({ message: 'Item berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };