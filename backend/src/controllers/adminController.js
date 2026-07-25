const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { extractInsertId } = require('../utils/dbHelpers');

const listUsers = async (req, res, next) => {
  try {
    const users = await db('users as u')
      .leftJoin('branches as b', 'b.id', 'u.branch_id')
      .select(
        'u.id',
        'u.full_name as fullName',
        'u.username as cedula',
        'u.username',
        'u.role',
        'u.is_active as isActive',
        'u.created_at as createdAt',
        'b.name as branchName'
      )
      .orderBy('u.id', 'asc');

    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

const findUserByCedula = async (req, res, next) => {
  try {
    const cedula = String(req.params.cedula || '').trim();
    if (!cedula) {
      return res.status(400).json({ message: 'Debes indicar una cedula valida.' });
    }

    const user = await db('users as u')
      .leftJoin('branches as b', 'b.id', 'u.branch_id')
      .where('u.username', cedula)
      .first(
        'u.id',
        'u.full_name as fullName',
        'u.username as cedula',
        'u.role',
        'u.is_active as isActive',
        'b.name as branchName'
      );

    if (!user) {
      return res.status(404).json({ message: 'No existe un usuario con esa cedula.' });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

const resetUserPasswordByCedula = async (req, res, next) => {
  try {
    const cedula = String(req.body.cedula || '').trim();
    const newPassword = String(req.body.newPassword || '');

    if (!cedula || !newPassword) {
      return res.status(400).json({ message: 'Cedula y nueva contraseña son obligatorias.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const user = await db('users').where({ username: cedula }).first('id', 'role');
    if (!user) {
      return res.status(404).json({ message: 'No existe un usuario con esa cedula.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db('users').where({ id: user.id }).update({
      password_hash: passwordHash,
      is_active: true
    });

    return res.json({ message: 'Contraseña reseteada correctamente.' });
  } catch (error) {
    return next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'supervisor', 'empleado'].includes(role)) {
      return res.status(400).json({ message: 'Rol invalido.' });
    }

    const updated = await db('users').where({ id }).update({ role });
    if (!updated) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json({ message: 'Rol actualizado correctamente.' });
  } catch (error) {
    return next(error);
  }
};

const listBranches = async (req, res, next) => {
  try {
    const branches = await db('branches').orderBy('id', 'asc');
    return res.json(branches);
  } catch (error) {
    return next(error);
  }
};

const createBranch = async (req, res, next) => {
  try {
    const { name, location } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'El nombre de la sucursal es obligatorio.' });
    }

    const insertResult = await db('branches').insert({ name, location: location || null });
    const id = extractInsertId(insertResult);
    return res.status(201).json({ message: 'Sucursal creada.', id });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ message: 'La sucursal ya existe.' });
    }
    return next(error);
  }
};

module.exports = {
  listUsers,
  findUserByCedula,
  resetUserPasswordByCedula,
  updateUserRole,
  listBranches,
  createBranch
};
