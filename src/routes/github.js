const express = require('express');
const passport = require('passport');
const { cookieOptions, setAuthCookie } = require('../utils/authCookie');

module.exports = () => {
  const router = express.Router();

  router.get(
    '/auth/github',
    passport.authenticate('github', {
      scope: ['user:email'],
    })
  );

  router.get(
    '/auth/github/callback',
    passport.authenticate('github', {
      session: false,
      failureRedirect: '/login?error=github',
    }),
    (req, res) => {
      //console.log('PASSPORT GITHUB SUCCESS:', req.user);

      setAuthCookie(res, req.user.id);

      res.redirect('/');
    }
  );

  return router;
};