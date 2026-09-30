const crypto = require('crypto');
const express = require('express');
const userModel = require('../models/userModel');
const { cookieOptions, setAuthCookie } = require('../utils/authCookie');

const stateOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 10 * 60 * 1000,
  path: '/auth/github',
};

module.exports = (db) => {
  const router = express.Router();
  const users = userModel(db);

  router.get('/auth/github', (req, res) => {
    const state = crypto.randomBytes(32).toString('hex');

    res.cookie('oauth_state', state, stateOptions);

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
      scope: 'read:user user:email',
      state,
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  });

  router.get('/auth/github/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const expectedState = req.cookies?.oauth_state;

    res.clearCookie('oauth_state', stateOptions);

    if (error) {
      return res.redirect('/login?error=github_cancelled');
    }

    if (
      typeof code !== 'string' ||
      typeof state !== 'string' ||
      !expectedState ||
      state !== expectedState
    ) {
      return res.redirect('/login?error=github');
    }

    try {
      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: process.env.GITHUB_REDIRECT_URI,
          }),
        }
      );

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        return res.redirect('/login?error=github');
      }

      const accessToken = tokenData.access_token;

      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${accessToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!userResponse.ok) {
        return res.redirect('/login?error=github');
      }

      const githubUser = await userResponse.json();

      let email = githubUser.email;

      if (!email) {
        const emailsResponse = await fetch(
          'https://api.github.com/user/emails',
          {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${accessToken}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
          }
        );

        if (emailsResponse.ok) {
          const emails = await emailsResponse.json();

          const primaryEmail = emails.find(
            (item) => item.primary && item.verified
          );

          email = primaryEmail?.email;
        }
      }

      if (!email) {
        return res.redirect('/login?error=github_no_email');
      }

      const githubId = String(githubUser.id);
      const name = githubUser.name || githubUser.login;
      const picture = githubUser.avatar_url;

      const user = await users.findByGithubId(githubId);

      let userId = user?.id;

      if (userId) {
        await users.updateGithubProfile(userId, name, picture);
      } else {
        userId = await users.createGithub(
          githubId,
          email,
          name,
          picture
        );
      }

      setAuthCookie(res, userId);

      res.redirect('/');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.redirect('/login?error=github_email_taken');
      }

      console.error('GitHub OAuth callback failed:', err.message);

      res.redirect('/login?error=github');
    }
  });

  router.get('/logout', (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.redirect('/');
  });

  return router;
};