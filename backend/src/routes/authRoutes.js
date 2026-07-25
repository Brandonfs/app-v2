const express = require('express');
const { register, bootstrapAdmin, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/bootstrap-admin', bootstrapAdmin);
router.post('/login', login);
router.get('/me', authenticate, me);

module.exports = router;
