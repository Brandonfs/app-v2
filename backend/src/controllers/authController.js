const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const env = require('../config/env');
const { extractInsertId } = require('../utils/dbHelpers');

const getCedula = (payload) => (payload.cedula || payload.username || '').trim();

const signToken = (user) => jwt.sign(
  { role: user.role, cedula: user.username },
  env.jwtSecret,
  { subject: String(user.id), expiresIn: env.jwtExpiresIn }
);

const register = async (req, res, next) => {
  try {
    const { fullName, password, role, branchId } = req.body;
    const cedula = getCedula(req.body);

    if (!fullName || !cedula || !password) {
      return res.status(400).json({ message: 'Nombre, cedula y password son obligatorios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const exists = await db('users').where({ username: cedula }).first();
    if (exists) {
      return res.status(409).json({ message: 'Ya existe un usuario con esa cedula.' });
    }

    const safeRole = 'empleado';

    const passwordHash = await bcrypt.hash(password, 10);
    const insertResult = await db('users').insert({
      full_name: fullName,
      username: cedula,
      password_hash: passwordHash,
      role: safeRole,
      branch_id: branchId || null,
      is_active: true
    });
    const id = extractInsertId(insertResult);

    return res.status(201).json({ message: 'Usuario registrado correctamente.', userId: id });
  } catch (error) {
    return next(error);
  }
};

const bootstrapAdmin = async (req, res, next) => {
  try {
    if (!env.bootstrapAdminToken) {
      return res.status(403).json({ message: 'Bootstrap admin deshabilitado.' });
    }

    const providedToken = req.headers['x-bootstrap-token'] || req.body.bootstrapToken;
    if (!providedToken || providedToken !== env.bootstrapAdminToken) {
      return res.status(401).json({ message: 'Token de bootstrap invalido.' });
    }

    const { fullName, password, branchId } = req.body;
    const cedula = getCedula(req.body);

    if (!fullName || !cedula || !password) {
      return res.status(400).json({ message: 'Nombre, cedula y password son obligatorios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const adminsCountRow = await db('users')
      .where({ role: 'admin', is_active: 1 })
      .count({ count: 'id' })
      .first();
    const adminsCount = Number(adminsCountRow?.count || 0);

    if (adminsCount > 0) {
      return res.status(409).json({ message: 'Ya existe al menos un usuario admin activo.' });
    }

    const exists = await db('users').where({ username: cedula }).first();
    if (exists) {
      return res.status(409).json({ message: 'Ya existe un usuario con esa cedula.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertResult = await db('users').insert({
      full_name: fullName,
      username: cedula,
      password_hash: passwordHash,
      role: 'admin',
      branch_id: branchId || null,
      is_active: true
    });
    const id = extractInsertId(insertResult);

    return res.status(201).json({
      message: 'Admin inicial creado correctamente.',
      userId: id
    });
  } catch (error) {
    return next(error);
  }
};

const recoverAdmin = async (req, res, next) => {
  try {
    if (!env.bootstrapAdminToken) {
      return res.status(403).json({ message: 'Bootstrap admin deshabilitado.' });
    }

    const providedToken = req.headers['x-bootstrap-token'] || req.body.bootstrapToken;
    if (!providedToken || providedToken !== env.bootstrapAdminToken) {
      return res.status(401).json({ message: 'Token de bootstrap invalido.' });
    }

    const { fullName, password, branchId } = req.body;
    const cedula = getCedula(req.body);

    if (!fullName || !cedula || !password) {
      return res.status(400).json({ message: 'Nombre, cedula y password son obligatorios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const existingUser = await db('users').where({ username: cedula }).first();

    if (existingUser) {
      await db('users')
        .where({ id: existingUser.id })
        .update({
          full_name: fullName,
          password_hash: passwordHash,
          role: 'admin',
          branch_id: branchId || null,
          is_active: true
        });

      return res.json({
        message: 'Admin recuperado correctamente.',
        userId: existingUser.id
      });
    }

    const insertResult = await db('users').insert({
      full_name: fullName,
      username: cedula,
      password_hash: passwordHash,
      role: 'admin',
      branch_id: branchId || null,
      is_active: true
    });
    const id = extractInsertId(insertResult);

    return res.status(201).json({
      message: 'Admin creado por recuperacion.',
      userId: id
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { password } = req.body;
    const cedula = getCedula(req.body);
    if (!cedula || !password) {
      return res.status(400).json({ message: 'Cedula y contraseña son obligatorios.' });
    }

    const user = await db('users').where({ username: cedula, is_active: 1 }).first();
    if (!user) {
      return res.status(401).json({ message: 'Credenciales invalidas.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales invalidas.' });
    }

    const token = signToken(user);

    return res.json({
      message: 'Login exitoso.',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        cedula: user.username,
        username: user.username,
        role: user.role,
        branchId: user.branch_id
      }
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await db('users as u')
      .leftJoin('branches as b', 'b.id', 'u.branch_id')
      .where('u.id', req.user.id)
      .first(
        'u.id',
        'u.full_name as fullName',
        'u.username as cedula',
        'u.username',
        'u.role',
        'u.branch_id as branchId',
        'b.name as branchName'
      );

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, bootstrapAdmin, recoverAdmin, login, me };
