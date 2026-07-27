const express = require('express');
const {
  listUsers,
  findUserByCedula,
  resetUserPasswordByCedula,
  updateUser,
  updateUserRole,
  listBranches,
  createBranch,
  updateBranch,
  getDisabledSummary,
  reactivateUser,
  reactivateBranch
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/users', authorize('admin'), listUsers);
router.get('/users/by-cedula/:cedula', authorize('admin'), findUserByCedula);
router.patch('/users/reset-password', authorize('admin'), resetUserPasswordByCedula);
router.patch('/users/:id', authorize('admin'), updateUser);
router.patch('/users/:id/role', authorize('admin'), updateUserRole);
router.patch('/users/:id/reactivate', authorize('admin'), reactivateUser);

router.get('/branches', authorize('admin', 'supervisor'), listBranches);
router.post('/branches', authorize('admin'), createBranch);
router.patch('/branches/:id', authorize('admin'), updateBranch);
router.patch('/branches/:id/reactivate', authorize('admin'), reactivateBranch);

router.get('/disabled', authorize('admin'), getDisabledSummary);

module.exports = router;
