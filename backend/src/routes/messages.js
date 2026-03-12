const express = require('express');
const { 
  sendMessage, getMessages, getConversations,
  getMyProjects, getProjectMessages, sendProjectMessage
} = require('../controllers/messages');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Peer-to-peer messaging
router.post('/send', authMiddleware, sendMessage);
router.get('/conversations', authMiddleware, getConversations);
router.get('/direct/:user', authMiddleware, getMessages);

// Project group messaging
router.get('/projects', authMiddleware, getMyProjects);
router.get('/project/:projectId', authMiddleware, getProjectMessages);
router.post('/project/:projectId', authMiddleware, sendProjectMessage);

module.exports = router;
