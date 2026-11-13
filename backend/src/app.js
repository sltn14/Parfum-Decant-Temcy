const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const session = require('express-session');
const passport = require('./config/passport');
const sequelize = require('./config/database');

// Import models
require('./modules/products/product.model');
require('./modules/auth/user.model');
require('./modules/cart/cart.model');
require('./modules/cart/cart_item.model');
require('./modules/orders/order.model');
require('./modules/orders/order_item.model');
require('./modules/reviews/review.model');
require('./modules/notification/notification.model');
require('./modules/favorites/favorite.model');
require('./modules/addresses/address.model');
require('./modules/vouchers/voucher.model');
require('./modules/tracking/tracking.model');
require('./modules/sysadmin/system_config.model');
require('./modules/sysadmin/system_log.model');

const app = express();
const httpServer = http.createServer(app);

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

app.set('io', io);

// Socket.io: identitas diambil dari JWT saat handshake, bukan dari klien.
// Klien mengirim { auth: { token } } dan otomatis masuk ke room miliknya sendiri,
// jadi tidak ada yang bisa mendengarkan notifikasi pengguna lain.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.user_id;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user_${socket.data.userId}`);

  socket.on('disconnect', () => {
    // room ditinggalkan otomatis
  });
});

// Di belakang reverse proxy (Nginx, dsb.) req.ip adalah IP proxy, sehingga pembatas laju
// (middleware/rateLimit.middleware.js memakai req.ip) akan menganggap semua pengguna satu IP.
// Set TRUST_PROXY=<jumlah proxy di depan app> (mis. 1) agar req.ip diambil dari X-Forwarded-For.
// Default: nonaktif. Jangan diaktifkan bila server diakses langsung tanpa proxy, karena
// klien bisa memalsukan header X-Forwarded-For dan menghindari rate limit.
if (process.env.TRUST_PROXY && process.env.TRUST_PROXY !== 'false') {
  const tp = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(tp) ? parseInt(tp, 10) : tp === 'true' ? 1 : tp);
}

// Header keamanan. CSP dimatikan karena ini API (bukan halaman HTML).
// crossOriginResourcePolicy 'cross-origin' wajib: gambar /uploads dimuat dari origin
// frontend (port berbeda), jika tidak gambar produk akan diblokir browser.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Raw body untuk webhook Midtrans
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/products', require('./modules/products/product.routes'));
app.use('/api/cart', require('./modules/cart/cart.routes'));
app.use('/api/orders', require('./modules/orders/order.routes'));
app.use('/api/reviews', require('./modules/reviews/review.routes'));
app.use('/api/users', require('./modules/users/user.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.use('/api/sysadmin', require('./modules/sysadmin/sysadmin.routes'));
app.use('/api/notifications', require('./modules/notification/notification.routes'));
app.use('/api/chatbot', require('./modules/chatbot/chatbot.routes'));
app.use('/api/recommendations', require('./modules/recommendation/recommendation.routes'));
app.use('/api/favorites', require('./modules/favorites/favorite.routes'));
app.use('/api/addresses', require('./modules/addresses/address.routes'));
app.use('/api/shipping', require('./modules/shipping/shipping.routes'));
app.use('/api/vouchers', require('./modules/vouchers/voucher.routes'));
app.use('/api/tracking', require('./modules/tracking/tracking.routes'));
app.use('/api/stores', require('./modules/stores/store.routes'));
app.use('/api/couriers', require('./modules/couriers/courier.routes'));

app.get('/', (req, res) => {
  res.json({ message: 'Decant Temcy API is running' });
});

// Helper untuk save log dari controller lain (satu implementasi: utils/audit.js)
app.set('saveLog', require('./utils/audit').writeLog);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected!');

    // Sync model baru (tidak drop tabel yang ada)
    const SystemConfig = require('./modules/sysadmin/system_config.model');
    const SystemLog = require('./modules/sysadmin/system_log.model');
    await SystemConfig.sync({ alter: false });
    await SystemLog.sync({ alter: false });

    // Store pickup: buat tabel stores, tambah kolom di orders, isi store default kalau kosong
    const Store = require('./modules/stores/store.model');
    await Store.sync({ alter: false });
    await sequelize.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_store_id INTEGER');
    if ((await Store.count()) === 0) {
      await Store.create({ name: 'Decant Temcy Semarang', city: 'Semarang', address: 'Semarang' });
      console.log('Store default dibuat. Ubah alamat lengkapnya di Admin > Cabang Toko.');
    }

    // Kurir pengiriman: buat tabel couriers dan isi kurir bawaan bila kosong (cadangan: config/migration_add_couriers.sql)
    const Courier = require('./modules/couriers/courier.model');
    await Courier.sync({ alter: false });
    if ((await Courier.count()) === 0) {
      await Courier.bulkCreate(Courier.DEFAULTS);
      console.log('Kurir bawaan dibuat. Atur di Admin > Kurir.');
    }

    // Strategi Google OAuth dibuat dari konfigurasi sysadmin (DB) atau .env
    await passport.loadGoogleStrategy();

    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect DB:', err);
  }
};

// Hanya jalankan server bila file ini dieksekusi langsung (node src/app.js).
// Saat di-require (mis. oleh supertest di tests/), app diekspor tanpa membuka port atau koneksi DB.
if (require.main === module) startServer();

module.exports = { app, httpServer, startServer };
