const express = require('express');
const {
  listUsers,
  findUserByCedula,
  resetUserPasswordByCedula,
  updateUserRole,
  listBranches,
  createBranch
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/users', authorize('admin', 'supervisor'), listUsers);
router.get('/users/by-cedula/:cedula', authorize('admin'), findUserByCedula);
router.patch('/users/reset-password', authorize('admin'), resetUserPasswordByCedula);
router.patch('/users/:id/role', authorize('admin'), updateUserRole);
router.get('/branches', authorize('admin', 'supervisor', 'empleado'), listBranches);
router.post('/branches', authorize('admin'), createBranch);

module.exports = router;
