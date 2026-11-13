require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../modules/auth/user.model');
const { getConfig } = require('../utils/systemConfig');

// Dipanggil Passport setelah Google mengembalikan profil pengguna
const verifyGoogle = async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(null, false, { message: 'no_email' });

    let user = await User.findOne({ where: { google_id: profile.id } });

    if (!user) {
      user = await User.findOne({ where: { email } });

      if (user) {
        // Email sudah terdaftar: tautkan akun Google ke akun yang ada
        await user.update({ google_id: profile.id });
      } else {
        user = await User.create({
          full_name: profile.displayName,
          email,
          google_id: profile.id,
          is_verified: true,
          password: null
        });
      }
    }

    // Akun nonaktif tidak boleh login lewat Google (sama seperti login biasa)
    if (!user.is_active) return done(null, false, { message: 'inactive' });

    await user.update({ last_login_at: new Date() });
    return done(null, user);
  } catch (err) {
    console.error('Passport error:', err.message);
    return done(err, null);
  }
};

let googleReady = false;

// Strategi Google dibuat dari konfigurasi sysadmin (database) dengan cadangan .env.
// Panggil saat server start (setelah DB siap) dan setiap kali sysadmin mengubah
// GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET, supaya tidak perlu restart server.
const loadGoogleStrategy = async () => {
  const clientID = await getConfig('GOOGLE_CLIENT_ID');
  const clientSecret = await getConfig('GOOGLE_CLIENT_SECRET');

  if (!clientID || !clientSecret) {
    passport.unuse('google');
    googleReady = false;
    console.warn('Google OAuth belum dikonfigurasi (isi di Sysadmin > Konfigurasi atau .env)');
    return false;
  }

  passport.use('google', new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL: `${process.env.API_URL}/api/auth/google/callback`
  }, verifyGoogle));
  googleReady = true;
  return true;
};

const isGoogleReady = () => googleReady;

passport.serializeUser((user, done) => done(null, user.user_id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
module.exports.loadGoogleStrategy = loadGoogleStrategy;
module.exports.isGoogleReady = isGoogleReady;
