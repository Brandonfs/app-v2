const bcrypt = require('bcryptjs');
const db = require('../config/database');

const QR_GENERATOR_ACCOUNT = {
  fullName: 'Generador QR Sedes',
  cedula: 'qrgenerador@1@2@3',
  password: 'r3g1st4o@',
  role: 'qr_operator'
};

const ensureSystemUsers = async () => {
  const existing = await db('users').where({ username: QR_GENERATOR_ACCOUNT.cedula }).first('id');
  if (existing) {
    return;
  }

  const firstBranch = await db('branches').orderBy('id', 'asc').first('id');
  const passwordHash = await bcrypt.hash(QR_GENERATOR_ACCOUNT.password, 10);

  await db('users').insert({
    full_name: QR_GENERATOR_ACCOUNT.fullName,
    username: QR_GENERATOR_ACCOUNT.cedula,
    password_hash: passwordHash,
    role: QR_GENERATOR_ACCOUNT.role,
    branch_id: firstBranch?.id || null,
    is_active: true
  });
};

module.exports = { ensureSystemUsers, QR_GENERATOR_ACCOUNT };
