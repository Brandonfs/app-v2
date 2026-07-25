const express = require('express');
const { register, bootstrapAdmin, recoverAdmin, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/bootstrap-admin', bootstrapAdmin);
router.post('/recover-admin', recoverAdmin);
router.post('/login', login);
router.get('/me', authenticate, me);

module.exports = router;
