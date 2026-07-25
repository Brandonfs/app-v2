const express = require('express');
const {
  generateQr,
  getPublicBranchQrs,
  checkin,
  getMyAttendance,
  getAttendanceReport
} = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/public/branches-qr', getPublicBranchQrs);
router.post('/qr', authenticate, authorize('admin', 'supervisor'), generateQr);
router.post('/checkin', authenticate, authorize('admin', 'supervisor', 'empleado'), checkin);
router.get('/my', authenticate, authorize('admin', 'supervisor', 'empleado'), getMyAttendance);
router.get('/', authenticate, authorize('admin', 'supervisor'), getAttendanceReport);

module.exports = router;
