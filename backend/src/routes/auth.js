const express = require('express');
const { signup, login, getMe } = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
// Assuming logout is handled on client side by clearing token
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});
router.get('/me', authMiddleware, getMe);

module.exports = router;
