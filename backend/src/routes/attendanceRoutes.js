const express = require('express');
const {
  generateQr,
  getLiveBranchQrs,
  checkin,
  getMyAttendance,
  getAttendanceReport
} = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/live-branches-qr', authenticate, authorize('qr_operator'), getLiveBranchQrs);
router.post('/qr', authenticate, authorize('admin'), generateQr);
router.post('/checkin', authenticate, authorize('empleado'), checkin);
router.get('/my', authenticate, authorize('empleado'), getMyAttendance);
router.get('/', authenticate, authorize('admin', 'supervisor'), getAttendanceReport);

module.exports = router;
