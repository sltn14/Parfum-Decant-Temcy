const Review = require('./review.model');
const User = require('../auth/user.model');
const Order = require('../orders/order.model');
const OrderItem = require('../orders/order_item.model');
const Product = require('../products/product.model');

const MAX_COMMENT_LENGTH = 1000;

// rating harus bilangan bulat 1-5 (angka atau string angka murni); selain itu NaN
const parseRating = (v) => {
  const ok = typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v.trim()));
  const n = ok ? Number(v) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : NaN;
};

// komentar opsional; bila ada harus string maksimal 1000 karakter. Mengembalikan { error } atau { value }
const parseComment = (v) => {
  if (v === undefined || v === null || v === '') return { value: null };
  if (typeof v !== 'string') return { error: 'Komentar harus berupa teks' };
  if (v.length > MAX_COMMENT_LENGTH) return { error: `Komentar maksimal ${MAX_COMMENT_LENGTH} karakter` };
  return { value: v.trim() || null };
};

// Get reviews by product
const getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Review.findAndCountAll({
      where: { product_id: req.params.productId, is_active: true },
      include: [{ model: User, as: 'user', attributes: ['full_name', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const totalRating = rows.reduce((sum, r) => sum + r.rating, 0);
    const avg_rating = rows.length > 0 ? (totalRating / rows.length).toFixed(1) : '0.0';

    return res.status(200).json({
      total: count,
      avg_rating,
      total_reviews: count,
      reviews: rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Add review — UC-13: hanya untuk pembeli
const addReview = async (req, res) => {
  try {
    const { product_id, rating: rawRating, comment: rawComment } = req.body;

    if (!product_id || rawRating === undefined || rawRating === null) {
      return res.status(400).json({ message: 'product_id dan rating wajib diisi' });
    }
    const pid = parseInt(product_id);
    if (!Number.isInteger(pid)) return res.status(400).json({ message: 'product_id tidak valid' });

    const rating = parseRating(rawRating);
    if (Number.isNaN(rating)) {
      return res.status(400).json({ message: 'Rating harus bilangan bulat 1 sampai 5' });
    }
    const parsedComment = parseComment(rawComment);
    if (parsedComment.error) return res.status(400).json({ message: parsedComment.error });
    const comment = parsedComment.value;

    // Produk harus ada (bukan 500 karena pelanggaran foreign key)
    if (!(await Product.findByPk(pid))) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // UC-13: Validasi — user harus pernah beli produk ini
    const hasBought = await Order.findOne({
      where: {
        user_id: req.user.user_id,
        status: 'delivered' // hanya pesanan yang sudah selesai
      },
      include: [{
        model: OrderItem,
        as: 'items',
        where: { product_id: pid },
        required: true
      }]
    });

    if (!hasBought) {
      return res.status(403).json({
        message: 'Kamu hanya dapat memberikan ulasan pada produk yang sudah dibeli dan diterima'
      });
    }

    // Cek sudah pernah review
    const existing = await Review.findOne({
      where: { user_id: req.user.user_id, product_id: pid }
    });
    if (existing && existing.is_active) {
      return res.status(400).json({ message: 'Kamu sudah memberikan ulasan untuk produk ini' });
    }

    // Ulasan yang pernah dihapus (soft delete) dipakai lagi supaya satu pengguna tetap satu ulasan per produk
    let review;
    if (existing) {
      await existing.update({ rating, comment, is_active: true });
      review = existing;
    } else {
      review = await Review.create({
        user_id: req.user.user_id,
        product_id: pid,
        rating,
        comment
      });
    }

    // Ambil review lengkap dengan user info
    const fullReview = await Review.findByPk(review.review_id, {
      include: [{ model: User, as: 'user', attributes: ['full_name', 'avatar'] }]
    });

    return res.status(201).json({ message: 'Ulasan berhasil ditambahkan', review: fullReview });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      where: { review_id: req.params.id, user_id: req.user.user_id, is_active: true }
    });
    if (!review) return res.status(404).json({ message: 'Review tidak ditemukan' });

    const rating = parseRating(req.body.rating);
    if (Number.isNaN(rating)) {
      return res.status(400).json({ message: 'Rating harus bilangan bulat 1 sampai 5' });
    }
    const parsedComment = parseComment(req.body.comment);
    if (parsedComment.error) return res.status(400).json({ message: parsedComment.error });

    await review.update({ rating, comment: parsedComment.value });
    const fullReview = await Review.findByPk(review.review_id, {
      include: [{ model: User, as: 'user', attributes: ['full_name', 'avatar'] }]
    });
    return res.status(200).json({ message: 'Review berhasil diupdate', review: fullReview });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete review (soft delete)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      where: { review_id: req.params.id, user_id: req.user.user_id, is_active: true }
    });
    if (!review) return res.status(404).json({ message: 'Review tidak ditemukan' });

    await review.update({ is_active: false });
    return res.status(200).json({ message: 'Review berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin: delete review
const adminDeleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review tidak ditemukan' });

    await review.update({ is_active: false });
    return res.status(200).json({ message: 'Review berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Cek apakah user bisa review produk ini
const checkCanReview = async (req, res) => {
  try {
    const { product_id } = req.params;

    const hasBought = await Order.findOne({
      where: {
        user_id: req.user.user_id,
        status: 'delivered'
      },
      include: [{
        model: OrderItem,
        as: 'items',
        where: { product_id: parseInt(product_id) },
        required: true
      }]
    });

    const hasReviewed = await Review.findOne({
      where: {
        user_id: req.user.user_id,
        product_id: parseInt(product_id),
        is_active: true
      }
    });

    return res.status(200).json({
      can_review: !!hasBought && !hasReviewed,
      has_bought: !!hasBought,
      has_reviewed: !!hasReviewed
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProductReviews, addReview, updateReview,
  deleteReview, adminDeleteReview, checkCanReview
};