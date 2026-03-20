const express = require('express');
const { signup, login, getMe, verifyEmail, forgotPassword, resetPassword } = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});
router.get('/me', authMiddleware, getMe);

module.exports = router;
