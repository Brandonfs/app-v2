const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const db = require('../config/database');
const env = require('../config/env');
const { isLateByThreshold } = require('../utils/time');

const createQrForBranch = async ({ branchId, generatedBy, expiresIn = '30s' }) => {
  const nonce = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const generatedAt = new Date().toISOString();
  const payload = {
    branchId,
    generatedAt,
    nonce,
    generatedBy: generatedBy || null
  };

  const qrToken = jwt.sign(payload, env.qrSecret, { expiresIn });
  const qrDataUrl = await QRCode.toDataURL(qrToken);

  return {
    qrToken,
    qrDataUrl,
    generatedAt,
    expiresInSeconds: expiresIn === '10m' ? 600 : 5
  };
};

const calculateStatus = (date) => {
  return isLateByThreshold(date, env.lateAfter, env.appTimezone) ? 'late' : 'on_time';
};

const generateQr = async (req, res, next) => {
  try {
    const branchId = req.body.branchId || req.user.branch_id || null;

    if (branchId) {
      const branch = await db('branches').where({ id: branchId, is_active: 1 }).first('id');
      if (!branch) {
        return res.status(400).json({ message: 'La sede seleccionada no esta disponible.' });
      }
    }

    const qr = await createQrForBranch({
      branchId,
      generatedBy: req.user.id,
      expiresIn: '10m'
    });

    return res.json(qr);
  } catch (error) {
    return next(error);
  }
};

const getLiveBranchQrs = async (req, res, next) => {
  try {
    const branches = await db('branches')
      .where({ is_active: 1 })
      .select('id', 'name')
      .orderBy('name', 'asc');
    const items = await Promise.all(branches.map(async (branch) => {
      const qr = await createQrForBranch({ branchId: branch.id, generatedBy: null, expiresIn: '5s' });
      return {
        branchId: branch.id,
        branchName: branch.name,
        ...qr
      };
    }));

    return res.json(items);
  } catch (error) {
    return next(error);
  }
};

const checkin = async (req, res, next) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) {
      return res.status(400).json({ message: 'QR token es obligatorio.' });
    }

    const decoded = jwt.verify(qrToken, env.qrSecret);
    const now = new Date();

    const latestAttendance = await db('attendance')
      .where({ user_id: req.user.id })
      .orderBy('checked_in_at', 'desc')
      .first('checked_in_at');

    if (latestAttendance?.checked_in_at) {
      const lastCheckin = new Date(latestAttendance.checked_in_at);
      const cooldownMs = Math.max(1, Number(env.attendanceCooldownMinutes || 10)) * 60 * 1000;
      const nextAllowedAt = new Date(lastCheckin.getTime() + cooldownMs);

      if (now < nextAllowedAt) {
        return res.status(429).json({
          message: `Debes esperar ${env.attendanceCooldownMinutes} minutos para volver a registrar asistencia.`,
          nextAllowedAt: nextAllowedAt.toISOString()
        });
      }
    }

    const status = calculateStatus(now);

    const branchId = decoded.branchId || req.user.branch_id || null;
    const branch = branchId
      ? await db('branches').where({ id: branchId, is_active: 1 }).first('name')
      : null;

    if (branchId && !branch) {
      return res.status(400).json({ message: 'La sede del QR se encuentra deshabilitada.' });
    }

    await db('attendance').insert({
      user_id: req.user.id,
      branch_id: branchId,
      checked_in_at: now,
      status,
      qr_nonce: decoded.nonce,
      qr_generated_at: decoded.generatedAt
    });

    return res.status(201).json({
      message: status === 'late' ? 'Asistencia registrada como tardia.' : 'Asistencia registrada a tiempo.',
      status,
      qrGeneratedAt: decoded.generatedAt,
      checkedInAt: now.toISOString(),
      branchName: branch?.name || 'Sin sede'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'QR invalido o expirado.' });
    }
    return next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const records = await db('attendance as a')
      .leftJoin('branches as b', 'b.id', 'a.branch_id')
      .where('a.user_id', req.user.id)
      .orderBy('a.checked_in_at', 'desc')
      .select(
        'a.id',
        'a.qr_generated_at as qrGeneratedAt',
        'a.checked_in_at as checkedInAt',
        'a.status',
        'b.name as branchName'
      );

    return res.json(records);
  } catch (error) {
    return next(error);
  }
};

const buildReportQuery = (filters) => {
  const query = db('attendance as a')
    .leftJoin('users as u', 'u.id', 'a.user_id')
    .leftJoin('branches as b', 'b.id', 'a.branch_id')
    .select(
      'a.id',
      'u.full_name as fullName',
      'u.username as cedula',
      'u.username',
      'u.role',
      'b.name as branchName',
      'a.checked_in_at as checkedInAt',
      'a.status',
      'a.qr_generated_at as qrGeneratedAt'
    )
    .orderBy('a.checked_in_at', 'desc');

  if (filters.startDate) {
    query.whereRaw('date(a.checked_in_at) >= ?', [filters.startDate]);
  }
  if (filters.endDate) {
    query.whereRaw('date(a.checked_in_at) <= ?', [filters.endDate]);
  }
  if (filters.status && !filters.lateAfter) {
    query.where('a.status', filters.status);
  }

  return query;
};

const applyLateHourFilter = (records, filters) => {
  if (!filters.lateAfter) {
    return records;
  }

  const withDerivedStatus = records.map((record) => {
    const isLate = isLateByThreshold(new Date(record.checkedInAt), filters.lateAfter, env.appTimezone);
    return {
      ...record,
      status: isLate ? 'late' : 'on_time'
    };
  });

  if (!filters.status) {
    return withDerivedStatus;
  }

  return withDerivedStatus.filter((record) => record.status === filters.status);
};

const getReportRows = async (filters) => {
  const rawRecords = await buildReportQuery(filters);
  return applyLateHourFilter(rawRecords, filters);
};

const getAttendanceReport = async (req, res, next) => {
  try {
    const records = await getReportRows(req.query);
    return res.json(records);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  generateQr,
  getLiveBranchQrs,
  checkin,
  getMyAttendance,
  getAttendanceReport,
  buildReportQuery,
  getReportRows
};
