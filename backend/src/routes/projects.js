const express = require('express');
const {
  createProject, getProjects, getProjectById, updateProject, deleteProject,
  addRole, deleteRole, applyForRole, handleApplication, removeMember
} = require('../controllers/projects');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Project CRUD
router.post('/create', authMiddleware, createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', authMiddleware, updateProject);
router.delete('/:id', authMiddleware, deleteProject);

// Role management
router.post('/:id/roles', authMiddleware, addRole);
router.delete('/:id/roles/:roleId', authMiddleware, deleteRole);

// Applications
router.post('/:id/roles/:roleId/apply', authMiddleware, applyForRole);
router.put('/:id/applications/:applicationId', authMiddleware, handleApplication);

// Team Management
router.delete('/:id/members/:memberId', authMiddleware, removeMember);

module.exports = router;
