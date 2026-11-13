const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// Kurir pengiriman yang ditawarkan di checkout. `code` mengikuti kode RajaOngkir (huruf kecil, mis. jne, anteraja).
// Kode "cod" khusus: ongkir 0, ditangani sendiri tanpa memanggil RajaOngkir.
const Courier = sequelize.define('Courier', {
  courier_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(60), allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { tableName: 'couriers', timestamps: true });

// Kurir awal (dipakai saat tabel pertama kali dibuat dan sebagai cadangan bila tabel belum ada)
Courier.DEFAULTS = [
  { code: 'jne', name: 'JNE', sort_order: 1 },
  { code: 'jnt', name: 'J&T Express', sort_order: 2 },
  { code: 'sicepat', name: 'SiCepat', sort_order: 3 },
  { code: 'cod', name: 'COD (diantar owner)', sort_order: 4 }
];

module.exports = Courier;
