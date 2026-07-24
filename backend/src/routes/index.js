const express = require('express');
const authRoutes = require('./authRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const adminRoutes = require('./adminRoutes');
const reportRoutes = require('./reportRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'qr-attendance-api' });
});

router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
