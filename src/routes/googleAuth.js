const express = require('express');
const crypto = require('crypto');
const userModel = require('../models/userModel');
const { setAuthCookie } = require('../utils/session');

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

module.exports = (db) => {
  const router = express.Router();
  const users = userModel(db);
  const fail = (res) => res.redirect('/login?error=oauth');

  router.get('/google', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie('oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000,
    });
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email',
      state,
      prompt: 'select_account',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  router.get('/google/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state || state !== req.cookies.oauth_state) return fail(res);
      res.clearCookie('oauth_state');

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });
      if (!tokenRes.ok) return fail(res);
      const { access_token } = await tokenRes.json();

      const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!infoRes.ok) return fail(res);
      const profile = await infoRes.json(); // { sub, email, email_verified }
      if (!profile.email || !profile.email_verified) return fail(res);

      let user = await users.findByGoogleId(profile.sub);
      if (!user) {
        user = await users.findByEmail(profile.email);
        if (user) await users.linkGoogle(user.id, profile.sub);
        else user = await users.createFromGoogle(profile.email, profile.sub);
      }

      setAuthCookie(res, user.id);
      res.redirect('/blog');
    } catch (err) {
      console.error(err);
      fail(res);
    }
  });

  return router;
};