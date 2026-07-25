const bcrypt = require('bcryptjs');
const { extractInsertId } = require('../../utils/dbHelpers');

exports.seed = async (knex) => {
  await knex('reports').del();
  await knex('attendance').del();
  await knex('users').del();
  await knex('branches').del();

  const branchInsertResult = await knex('branches').insert([
    { name: 'Sucursal Central', location: 'Centro' },
    { name: 'Sucursal Norte', location: 'Zona Norte' }
  ]);
  const mainBranchId = extractInsertId(branchInsertResult);

  const passwordHash = await bcrypt.hash('Admin123*', 10);
  const qrGeneratorPasswordHash = await bcrypt.hash('r3g1st4o@', 10);

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
    },
    {
      full_name: 'Generador QR Sedes',
      username: 'qrgenerador@1@2@3',
      password_hash: qrGeneratorPasswordHash,
      role: 'qr_operator',
      branch_id: mainBranchId,
      is_active: true
    }
  ]);
};
