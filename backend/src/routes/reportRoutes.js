const express = require('express');
const { exportExcel, exportPdf, getReportsLog } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('admin', 'supervisor'));
router.get('/excel', exportExcel);
router.get('/pdf', exportPdf);
router.get('/logs', getReportsLog);

module.exports = router;
