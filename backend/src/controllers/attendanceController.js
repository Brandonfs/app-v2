const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const db = require('../config/database');
const env = require('../config/env');

const calculateStatus = (date) => {
  const [hours, minutes] = env.lateAfter.split(':').map(Number);
  const threshold = new Date(date);
  threshold.setHours(hours, minutes, 0, 0);
  return date > threshold ? 'late' : 'on_time';
};

const generateQr = async (req, res, next) => {
  try {
    const nonce = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const generatedAt = new Date().toISOString();
    const payload = {
      branchId: req.user.branch_id || null,
      generatedAt,
      nonce,
      generatedBy: req.user.id
    };

    const qrToken = jwt.sign(payload, env.qrSecret, { expiresIn: '10m' });
    const qrDataUrl = await QRCode.toDataURL(qrToken);

    return res.json({ qrToken, qrDataUrl, expiresIn: '10m' });
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
    const status = calculateStatus(now);

    await db('attendance').insert({
      user_id: req.user.id,
      branch_id: decoded.branchId || req.user.branch_id || null,
      checked_in_at: now,
      status,
      qr_nonce: decoded.nonce,
      qr_generated_at: decoded.generatedAt
    });

    return res.status(201).json({
      message: status === 'late' ? 'Asistencia registrada como tardia.' : 'Asistencia registrada a tiempo.',
      status,
      checkedInAt: now.toISOString()
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
      'u.username',
      'u.role',
      'b.name as branchName',
      'a.checked_in_at as checkedInAt',
      'a.status'
    )
    .orderBy('a.checked_in_at', 'desc');

  if (filters.startDate) {
    query.whereRaw('date(a.checked_in_at) >= ?', [filters.startDate]);
  }
  if (filters.endDate) {
    query.whereRaw('date(a.checked_in_at) <= ?', [filters.endDate]);
  }
  if (filters.status) {
    query.where('a.status', filters.status);
  }

  return query;
};

const getAttendanceReport = async (req, res, next) => {
  try {
    const records = await buildReportQuery(req.query);
    return res.json(records);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  generateQr,
  checkin,
  getMyAttendance,
  getAttendanceReport,
  buildReportQuery
};
