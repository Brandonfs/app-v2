const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado.' });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await db('users')
      .where({ id: payload.sub, is_active: 1 })
      .first(['id', 'full_name', 'username', 'role', 'branch_id']);

    if (!user) {
      return res.status(401).json({ message: 'Token invalido o usuario inactivo.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'No autorizado.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado.' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'No tienes permisos para esta accion.' });
  }

  return next();
};

module.exports = { authenticate, authorize };
