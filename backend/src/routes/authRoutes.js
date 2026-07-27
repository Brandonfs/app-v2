const express = require('express');
const { register, bootstrapAdmin, recoverAdmin, login, me, verifyPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/bootstrap-admin', bootstrapAdmin);
router.post('/recover-admin', recoverAdmin);
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/verify-password', authenticate, verifyPassword);

module.exports = router;
