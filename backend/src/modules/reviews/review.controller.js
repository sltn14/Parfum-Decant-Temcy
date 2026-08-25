const Review = require('./review.model');
const Product = require('../products/product.model');
const User = require('../auth/user.model');
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

// Add review
const addReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ message: 'product_id dan rating wajib diisi' });
    }

    const existing = await Review.findOne({
      where: { user_id: req.user.user_id, product_id }
    });
    if (existing) {
      return res.status(400).json({ message: 'Kamu sudah memberikan review untuk produk ini' });
    }

    const review = await Review.create({
      user_id: req.user.user_id,
      product_id,
      rating,
      comment
    });

    return res.status(201).json({ message: 'Review berhasil ditambahkan', review });
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

module.exports = { getProductReviews, addReview, updateReview, deleteReview, adminDeleteReview };