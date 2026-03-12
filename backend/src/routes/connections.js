const express = require('express');
const router = express.Router();
const { sendRequest, getPendingRequests, getConnections, updateRequest, removeConnection } = require('../controllers/connections');
const authenticateToken = require('../middleware/auth');

router.post('/request', authenticateToken, sendRequest);
router.get('/pending', authenticateToken, getPendingRequests);
router.get('/', authenticateToken, getConnections);
router.put('/:id', authenticateToken, updateRequest);
router.delete('/:id', authenticateToken, removeConnection);

module.exports = router;
