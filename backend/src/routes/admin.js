const express = require('express');
const {
  getAllUsers, getAllProjects, getAllStartups, deleteUser, deleteProject, deleteStartup,
  getAllReports, resolveReport, removeProjectMember, removeStartupMember
} = require('../controllers/admin');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Simple admin check based on hardcoded email for now
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.email === 'nitnaware.prathmesh@gmail.com') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

router.use(authMiddleware, adminMiddleware);

router.get('/users', getAllUsers);
router.get('/projects', getAllProjects);
router.get('/startups', getAllStartups);
router.get('/reports', getAllReports);
router.delete('/users/:id', deleteUser);
router.delete('/projects/:id', deleteProject);
router.delete('/startups/:id', deleteStartup);
router.delete('/projects/:projectId/members/:memberId', removeProjectMember);
router.delete('/startups/:startupId/members/:memberId', removeStartupMember);
router.put('/reports/:id/resolve', resolveReport);

module.exports = router;
