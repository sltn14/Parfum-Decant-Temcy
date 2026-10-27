const User = require('../auth/user.model');
const Order = require('../orders/order.model');
const OrderItem = require('../orders/order_item.model');
const Product = require('../products/product.model');
const Review = require('../reviews/review.model');
const bcrypt = require('bcryptjs');
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

const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'google_id', 'reset_token', 'reset_token_expires'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    return res.status(200).json({ total: count, users: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// UC-24: Tambah akun oleh admin
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, phone, role = 'customer' } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password minimal 8 karakter' });
    }

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role,
      is_active: true,
      is_verified: true
    });

    return res.status(201).json({
      message: 'Akun berhasil dibuat',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// UC-25: Edit akun oleh admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const { full_name, email, phone, role, password } = req.body;

    // Cek email duplikat kalau email diubah
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: 'Email sudah digunakan akun lain' });
      }
    }

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role && ['customer', 'admin'].includes(role)) updateData.role = role;
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password minimal 8 karakter' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    return res.status(200).json({
      message: 'Akun berhasil diupdate',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

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
  getDashboard, getUsers, createUser, updateUser,
  toggleUserStatus, getReviews, getSalesReport
};