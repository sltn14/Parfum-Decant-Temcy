const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../auth/user.model');

const Notification = sequelize.define('Notification', {
  notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'user_id' } },
  title: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('order', 'promo', 'system'), defaultValue: 'system' },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'notifications', timestamps: true });

module.exports = Notification;