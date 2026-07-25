const path = require('path');
const express = require('express');

const router = express.Router();
const publicDir = path.join(process.cwd(), 'frontend', 'public');

router.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
router.get('/user', (req, res) => res.sendFile(path.join(publicDir, 'user.html')));
router.get('/scan', (req, res) => res.sendFile(path.join(publicDir, 'scan.html')));
router.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
router.get('/generator', (req, res) => res.sendFile(path.join(publicDir, 'generator.html')));

module.exports = router;
