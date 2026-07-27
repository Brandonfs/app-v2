const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { extractInsertId } = require('../utils/dbHelpers');

const VALID_ROLES = ['admin', 'supervisor', 'empleado'];

const normalizeBool = (value, fallback = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    if (value === '1' || value.toLowerCase() === 'true') return true;
    if (value === '0' || value.toLowerCase() === 'false') return false;
  }
  return fallback;
};

const listUsers = async (req, res, next) => {
  try {
    const includeInactive = req.user?.role === 'admin' && req.query.includeInactive === '1';
    const users = await db('users as u')
      .leftJoin('branches as b', 'b.id', 'u.branch_id')
      .select(
        'u.id',
        'u.full_name as fullName',
        'u.username as cedula',
        'u.username',
        'u.role',
        'u.branch_id as branchId',
        'u.is_active as isActive',
        'u.created_at as createdAt',
        'b.name as branchName'
      )
      .modify((query) => {
        if (!includeInactive) {
          query.where('u.is_active', 1);
        }
      })
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

const updateUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ message: 'ID de usuario invalido.' });
    }

    const existingUser = await db('users').where({ id: userId }).first('id', 'role');
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (existingUser.role === 'qr_operator') {
      return res.status(403).json({ message: 'No se puede editar el usuario del sistema QR.' });
    }

    const fullName = String(req.body.fullName || '').trim();
    const cedula = String(req.body.cedula || '').trim();
    const role = String(req.body.role || '').trim();
    const isActive = normalizeBool(req.body.isActive, true);
    const branchId = req.body.branchId ? Number(req.body.branchId) : null;

    if (!fullName || !cedula || !role) {
      return res.status(400).json({ message: 'Nombre, cedula y rol son obligatorios.' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rol invalido.' });
    }

    const repeatedCedula = await db('users')
      .where({ username: cedula })
      .whereNot({ id: userId })
      .first('id');
    if (repeatedCedula) {
      return res.status(409).json({ message: 'Ya existe otro usuario con esa cedula.' });
    }

    let validBranchId = null;
    if (branchId) {
      const branch = await db('branches').where({ id: branchId, is_active: 1 }).first('id');
      if (!branch) {
        return res.status(400).json({ message: 'La sede seleccionada no esta activa.' });
      }
      validBranchId = branchId;
    }

    await db('users').where({ id: userId }).update({
      full_name: fullName,
      username: cedula,
      role,
      branch_id: validBranchId,
      is_active: isActive
    });

    return res.json({ message: 'Usuario actualizado correctamente.' });
  } catch (error) {
    return next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
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
    const includeInactive = req.user?.role === 'admin' && req.query.includeInactive === '1';
    const branches = await db('branches')
      .modify((query) => {
        if (!includeInactive) {
          query.where('is_active', 1);
        }
      })
      .orderBy('id', 'asc');
    return res.json(branches);
  } catch (error) {
    return next(error);
  }
};

const createBranch = async (req, res, next) => {
  try {
    const { name, location } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'El nombre de la sede es obligatorio.' });
    }

    const insertResult = await db('branches').insert({
      name,
      location: location || null,
      is_active: true
    });
    const id = extractInsertId(insertResult);
    return res.status(201).json({ message: 'Sede creada.', id });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ message: 'La sede ya existe.' });
    }
    return next(error);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    const branchId = Number(req.params.id);
    if (!Number.isFinite(branchId)) {
      return res.status(400).json({ message: 'ID de sede invalido.' });
    }

    const existing = await db('branches').where({ id: branchId }).first('id');
    if (!existing) {
      return res.status(404).json({ message: 'Sede no encontrada.' });
    }

    const name = String(req.body.name || '').trim();
    const location = String(req.body.location || '').trim();
    const isActive = normalizeBool(req.body.isActive, true);

    if (!name) {
      return res.status(400).json({ message: 'El nombre de la sede es obligatorio.' });
    }

    const duplicate = await db('branches')
      .where({ name })
      .whereNot({ id: branchId })
      .first('id');
    if (duplicate) {
      return res.status(409).json({ message: 'Ya existe otra sede con ese nombre.' });
    }

    await db('branches').where({ id: branchId }).update({
      name,
      location: location || null,
      is_active: isActive
    });

    return res.json({ message: isActive ? 'Sede actualizada.' : 'Sede deshabilitada.' });
  } catch (error) {
    return next(error);
  }
};

const getDisabledSummary = async (req, res, next) => {
  try {
    const [users, branches] = await Promise.all([
      db('users')
        .where({ is_active: 0 })
        .orderBy('id', 'asc')
        .select('id', 'full_name as fullName', 'username as cedula', 'role'),
      db('branches')
        .where({ is_active: 0 })
        .orderBy('id', 'asc')
        .select('id', 'name', 'location')
    ]);

    return res.json({ users, branches });
  } catch (error) {
    return next(error);
  }
};

const reactivateUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ message: 'ID de usuario invalido.' });
    }

    const updated = await db('users')
      .where({ id: userId })
      .whereNot({ role: 'qr_operator' })
      .update({ is_active: true });

    if (!updated) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json({ message: 'Usuario habilitado nuevamente.' });
  } catch (error) {
    return next(error);
  }
};

const reactivateBranch = async (req, res, next) => {
  try {
    const branchId = Number(req.params.id);
    if (!Number.isFinite(branchId)) {
      return res.status(400).json({ message: 'ID de sede invalido.' });
    }

    const updated = await db('branches').where({ id: branchId }).update({ is_active: true });
    if (!updated) {
      return res.status(404).json({ message: 'Sede no encontrada.' });
    }

    return res.json({ message: 'Sede habilitada nuevamente.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listUsers,
  findUserByCedula,
  resetUserPasswordByCedula,
  updateUser,
  updateUserRole,
  listBranches,
  createBranch,
  updateBranch,
  getDisabledSummary,
  reactivateUser,
  reactivateBranch
};
