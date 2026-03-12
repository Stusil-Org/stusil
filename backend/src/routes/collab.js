const express = require('express');
const { sendRequest, acceptRequest, rejectRequest, getRequests } = require('../controllers/collab');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/request', authMiddleware, sendRequest);
router.post('/accept', authMiddleware, acceptRequest);
router.post('/reject', authMiddleware, rejectRequest);
router.get('/requests', authMiddleware, getRequests);

module.exports = router;
