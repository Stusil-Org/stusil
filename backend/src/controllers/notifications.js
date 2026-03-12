const prisma = require('../services/db');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { is_read: true }
    });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.id, is_read: false },
      data: { is_read: true }
    });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { user_id: req.user.id, is_read: false }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Helper to create notification + emit socket event
exports.createNotification = async (io, userId, { type, title, body, link }) => {
  try {
    const notification = await prisma.notification.create({
      data: { user_id: userId, type, title, body, link }
    });
    // Emit real-time
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notification);
    }
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
