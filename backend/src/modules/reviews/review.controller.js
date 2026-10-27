const Review = require('./review.model');
const Product = require('../products/product.model');
const User = require('../auth/user.model');
const Order = require('../orders/order.model');
const OrderItem = require('../orders/order_item.model');
const { Op } = require('sequelize');

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
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ message: 'product_id dan rating wajib diisi' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating harus antara 1 sampai 5' });
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
        where: { product_id: parseInt(product_id) },
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
      where: { user_id: req.user.user_id, product_id }
    });
    if (existing) {
      return res.status(400).json({ message: 'Kamu sudah memberikan ulasan untuk produk ini' });
    }

    const review = await Review.create({
      user_id: req.user.user_id,
      product_id,
      rating,
      comment
    });

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
      where: { review_id: req.params.id, user_id: req.user.user_id }
    });
    if (!review) return res.status(404).json({ message: 'Review tidak ditemukan' });

    await review.update({ rating: req.body.rating, comment: req.body.comment });
    return res.status(200).json({ message: 'Review berhasil diupdate', review });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete review (soft delete)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      where: { review_id: req.params.id, user_id: req.user.user_id }
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