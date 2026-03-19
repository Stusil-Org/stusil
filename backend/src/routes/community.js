const express = require('express');
const { getTrending, getLeaderboard } = require('../controllers/community');
const router = express.Router();

router.get('/trending', getTrending);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
