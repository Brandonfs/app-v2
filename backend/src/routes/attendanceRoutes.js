const express = require('express');
const {
  generateQr,
  checkin,
  getMyAttendance,
  getAttendanceReport
} = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.post('/qr', authorize('admin', 'supervisor'), generateQr);
router.post('/checkin', authorize('admin', 'supervisor', 'empleado'), checkin);
router.get('/my', authorize('admin', 'supervisor', 'empleado'), getMyAttendance);
router.get('/', authorize('admin', 'supervisor'), getAttendanceReport);

module.exports = router;
