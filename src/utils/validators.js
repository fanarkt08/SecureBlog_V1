const isValid = (email, password) =>
  typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email) &&
  typeof password === 'string' && password.length >= 8 && password.length <= 72;

module.exports = { isValid };