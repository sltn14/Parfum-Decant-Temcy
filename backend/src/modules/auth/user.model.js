const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  full_name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  avatar: { type: DataTypes.STRING(255), defaultValue: 'default-avatar.png' },
  role: { type: DataTypes.ENUM('customer', 'admin'), defaultValue: 'customer' },
  google_id: { type: DataTypes.STRING(255), allowNull: true },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  pref_gender: { type: DataTypes.ENUM('Male', 'Female', 'Unisex'), allowNull: true },
  pref_aroma: { type: DataTypes.STRING(100), allowNull: true },
  pref_longevity: { type: DataTypes.STRING(50), allowNull: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: true },
  birth_date: { type: DataTypes.DATEONLY, allowNull: true },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  reset_token: { type: DataTypes.STRING(255), allowNull: true },
  reset_token_expires: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;