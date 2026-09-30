const jwt = require('jsonwebtoken');

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 15 * 60 * 1000,
};

function setAuthCookie(res, userId) {
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
    subject: String(userId),
  });
  res.cookie('token', token, cookieOptions);
}

module.exports = { cookieOptions, setAuthCookie };