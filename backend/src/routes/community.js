const express = require('express');
const { getTrending } = require('../controllers/community');
const router = express.Router();

router.get('/trending', getTrending);

module.exports = router;
