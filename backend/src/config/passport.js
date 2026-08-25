require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../modules/auth/user.model');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google profile:', profile)

    let user = await User.findOne({ where: { google_id: profile.id } });
    console.log('User by google_id:', user)

    if (!user) {
      user = await User.findOne({ where: { email: profile.emails[0].value } });
      console.log('User by email:', user)

      if (user) {
        await user.update({ google_id: profile.id });
	console.log('Updated existing user with google_id')

      } else {
        user = await User.create({
          full_name: profile.displayName,
          email: profile.emails[0].value,
          google_id: profile.id,
          is_verified: true,
          password: null
        });
	console.log('Created new user:', user.user_id)
      }
    }

    console.log('Final user:', user?.user_id)
    return done(null, user);
  } catch (err) {
    console.error('Passport error:', err)
    return done(err, null);
  }
}));

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