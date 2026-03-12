const express = require('express');
const { createReport } = require('../controllers/reports');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/create', authMiddleware, createReport);

module.exports = router;
