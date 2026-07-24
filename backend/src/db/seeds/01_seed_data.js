const bcrypt = require('bcryptjs');

exports.seed = async (knex) => {
  await knex('reports').del();
  await knex('attendance').del();
  await knex('users').del();
  await knex('branches').del();

  const [mainBranchId] = await knex('branches').insert([
    { name: 'Sucursal Central', location: 'Centro' },
    { name: 'Sucursal Norte', location: 'Zona Norte' }
  ]);

  const passwordHash = await bcrypt.hash('Admin123*', 10);

  await knex('users').insert([
    {
      full_name: 'Administrador Demo',
      username: 'admin',
      password_hash: passwordHash,
      role: 'admin',
      branch_id: mainBranchId,
      is_active: true
    },
    {
      full_name: 'Supervisor Demo',
      username: 'supervisor',
      password_hash: passwordHash,
      role: 'supervisor',
      branch_id: mainBranchId,
      is_active: true
    },
    {
      full_name: 'Empleado Demo',
      username: 'empleado',
      password_hash: passwordHash,
      role: 'empleado',
      branch_id: mainBranchId,
      is_active: true
    }
  ]);
};
