const express = require('express');
const { getNotifications, markAsRead, markAllAsRead, getUnreadCount } = require('../controllers/notifications');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.get('/unread-count', authMiddleware, getUnreadCount);
router.put('/read-all', authMiddleware, markAllAsRead);
router.put('/:id/read', authMiddleware, markAsRead);

module.exports = router;
