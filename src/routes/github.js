const crypto = require('crypto');
const express = require('express');
const passport = require('passport');
const { Strategy: GitHubStrategy } = require('passport-github2');
const userModel = require('../models/userModel');
const { cookieOptions, setAuthCookie } = require('../utils/authCookie');

const stateOptions = { ...cookieOptions, maxAge: 10 * 60 * 1000, path: '/auth/github' };

const cookieStateStore = {
  store(req, meta, cb) {
    const state = crypto.randomBytes(32).toString('hex');
    req.res.cookie('github_state', state, stateOptions);
    cb(null, state);
  },
  verify(req, state, meta, cb) {
    const expected = req.cookies?.github_state;
    req.res.clearCookie('github_state', stateOptions);
    cb(null, !!expected && state === expected, state);
  },
};

module.exports = (db) => {
  const router = express.Router();
  const users = userModel(db);

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email'],
    allRawEmails: true,
    store: cookieStateStore,
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.find((e) => e.primary && e.verified)?.value;
      if (!email) return done(null, false);
      const userId = await users.loginFromProvider(
        'github', profile.id, email, profile.displayName || profile.username, profile.photos?.[0]?.value
      );
      done(null, userId);
    } catch (err) {
      done(err);
    }
  }));

  router.get('/auth/github', passport.authenticate('github', { session: false }));

  router.get('/auth/github/callback', (req, res, next) => {
    if (req.query.error) {
      res.clearCookie('github_state', stateOptions);
      return res.redirect('/login?error=github_cancelled');
    }
    passport.authenticate('github', { session: false }, (err, userId) => {
      if (err?.code === 'ER_DUP_ENTRY') return res.redirect('/login?error=github_email_taken');
      if (err) console.error('GitHub OAuth callback failed:', err.message);
      if (err || !userId) return res.redirect('/login?error=github');
      setAuthCookie(res, userId);
      res.redirect('/');
    })(req, res, next);
  });

  return router;
};
