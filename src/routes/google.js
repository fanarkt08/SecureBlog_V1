const crypto = require('crypto');
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const userModel = require('../models/userModel');
const { cookieOptions, setAuthCookie } = require('../utils/authCookie');

// Lax (pas Strict) : le retour depuis Google est une navigation cross-site
const stateOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 10 * 60 * 1000,
  path: '/auth/google',
};

module.exports = (db) => {
  const router = express.Router();
  const users = userModel(db);
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  router.get('/auth/google', (req, res) => {
    const state = crypto.randomBytes(32).toString('hex');
    res.cookie('oauth_state', state, stateOptions);
    res.redirect(client.generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      state,
      prompt: 'select_account',
    }));
  });

  router.get('/auth/google/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const expectedState = req.cookies?.oauth_state;
    res.clearCookie('oauth_state', stateOptions);

    if (error) return res.redirect('/login?error=google_cancelled');
    if (typeof code !== 'string' || typeof state !== 'string' || !expectedState || state !== expectedState) {
      return res.redirect('/login?error=google');
    }

    try {
      const { tokens } = await client.getToken(code);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const { sub, email, email_verified, name, picture } = ticket.getPayload();
      if (!email_verified) return res.redirect('/login?error=google');

      // Liaison par sub, jamais par email : un compte local du même email n'est pas repris
      const user = await users.findByGoogleSub(sub);
      let userId = user?.id;
      if (userId) await users.updateGoogleProfile(userId, name, picture);
      else userId = await users.createGoogle(sub, email, name, picture);

      setAuthCookie(res, userId);
      res.redirect('/');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.redirect('/login?error=google_email_taken');
      console.error('Google OAuth callback failed:', err.message);
      res.redirect('/login?error=google');
    }
  });

  router.get('/logout', (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.redirect('/');
  });

  return router;
};
