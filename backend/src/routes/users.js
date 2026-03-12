const express = require('express');
const router = express.Router();
const { getAllUsers, updateProfile, uploadProfilePhoto } = require('../controllers/users');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, getAllUsers);
router.put('/profile', authenticateToken, updateProfile);
router.put('/profile-photo', authenticateToken, uploadProfilePhoto);

module.exports = router;
