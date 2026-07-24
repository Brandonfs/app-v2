const db = require('../config/database');

const listUsers = async (req, res, next) => {
  try {
    const users = await db('users as u')
      .leftJoin('branches as b', 'b.id', 'u.branch_id')
      .select(
        'u.id',
        'u.full_name as fullName',
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

    const [id] = await db('branches').insert({ name, location: location || null });
    return res.status(201).json({ message: 'Sucursal creada.', id });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ message: 'La sucursal ya existe.' });
    }
    return next(error);
  }
};

module.exports = { listUsers, updateUserRole, listBranches, createBranch };
