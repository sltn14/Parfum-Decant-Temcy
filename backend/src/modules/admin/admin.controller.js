const User = require('../auth/user.model');
const Order = require('../orders/order.model');
const OrderItem = require('../orders/order_item.model');
const Product = require('../products/product.model');
const Review = require('../reviews/review.model');
const { Op } = require('sequelize');

const getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.count({ where: { role: 'customer' } });
    const totalProducts = await Product.count({ where: { is_active: true } });
    const totalOrders = await Order.count();
    const revenueResult = await Order.sum('total_price', { where: { status: 'delivered' } });
    const totalRevenue = revenueResult || 0;

    const ordersByStatus = await Order.findAll({
      attributes: ['status', [Order.sequelize.fn('COUNT', Order.sequelize.col('order_id')), 'count']],
      group: ['status'],
      raw: true
    });

    const recentOrders = await Order.findAll({
      include: [{ model: User, as: 'user', attributes: ['full_name'] }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    return res.status(200).json({
      stats: { totalUsers, totalProducts, totalOrders, totalRevenue },
      ordersByStatus,
      recentOrders
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Pengelolaan akun (lihat, buat, ubah, nonaktifkan) ada di modul sysadmin
// (modules/sysadmin), bukan di sini: rancangan menyerahkannya kepada Administrator Sistem.
const getReviews = async (req, res) => {
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

const getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const where = { status: 'delivered' };

    if (start_date && end_date) {
      where.createdAt = {
        [Op.between]: [new Date(start_date), new Date(end_date + 'T23:59:59')]
      };
    }

    const orders = await Order.findAll({
      where,
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['cost_price_per_ml']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);

    return res.status(200).json({
      totalOrders: orders.length,
      totalRevenue,
      orders
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboard, getReviews, getSalesReport
};