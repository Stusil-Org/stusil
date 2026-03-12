const express = require('express');
const { getPortfolio, updatePortfolio } = require('../controllers/portfolio');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/:username', getPortfolio);
router.put('/update', authMiddleware, updatePortfolio);

module.exports = router;
