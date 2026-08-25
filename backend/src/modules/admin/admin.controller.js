const User = require('../auth/user.model');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const OrderItem = require('../orders/order_item.model');
const Review = require('../reviews/review.model');
const sequelize = require('../../config/database');

// Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count({ where: { role: 'customer' } });
    const totalProducts = await Product.count({ where: { is_active: true } });
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('total_price', { where: { status: 'delivered' } });

    const recentOrders = await Order.findAll({
      include: [
        { model: User, as: 'user', attributes: ['full_name', 'email'] },
        { model: OrderItem, as: 'items' }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const ordersByStatus = await Order.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('order_id')), 'count']],
      group: ['status']
    });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue || 0
      },
      recentOrders,
      ordersByStatus
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { Op } = require('sequelize');

    const where = { role: 'customer' };
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'google_id'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({ total: count, users: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Toggle user active status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    await user.update({ is_active: !user.is_active });
    return res.status(200).json({
      message: `User berhasil ${user.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
      user
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all reviews (admin)
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Review.findAndCountAll({
      include: [
        { model: User, as: 'user', attributes: ['full_name'] },
        { model: Product, as: 'product', attributes: ['product_name', 'brand'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({ total: count, reviews: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Sales report
const getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const { Op } = require('sequelize');

    const where = { status: 'delivered' };
    if (start_date && end_date) {
      where.createdAt = { [Op.between]: [new Date(start_date), new Date(end_date)] };
    }

    const orders = await Order.findAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']]
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);
    const totalOrders = orders.length;

    return res.status(200).json({ totalRevenue, totalOrders, orders });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboardStats, getAllUsers, toggleUserStatus, getAllReviews, getSalesReport };