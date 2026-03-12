const express = require('express');
const {
  createStartup, getStartups, getStartupById, updateStartup, deleteStartup,
  addRole, applyForRole, handleApplication, removeMember
} = require('../controllers/startups');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/create', authMiddleware, createStartup);
router.get('/', getStartups);
router.get('/:id', getStartupById);
router.put('/:id', authMiddleware, updateStartup);
router.delete('/:id', authMiddleware, deleteStartup);

// Roles & Applications
router.post('/:id/roles', authMiddleware, addRole);
router.post('/:id/roles/:roleId/apply', authMiddleware, applyForRole);
router.put('/:id/applications/:applicationId', authMiddleware, handleApplication);

// Team Management
router.delete('/:id/members/:memberId', authMiddleware, removeMember);

module.exports = router;
