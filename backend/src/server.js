require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const collabRoutes = require('./routes/collab');
const portfolioRoutes = require('./routes/portfolio');
const startupRoutes = require('./routes/startups');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const connectionRoutes = require('./routes/connections');
const notificationRoutes = require('./routes/notifications');
const communityRoutes = require('./routes/community');
const initSockets = require('./sockets');

const app = express();
const server = http.createServer(app);

// Sockets setup
const io = new Server(server, {
  cors: {
    origin: 'https://stusil.vercel.app',
  }
});

// Attach io to app so controllers can access it via req.app.get('io')
app.set('io', io);

app.use(cors({
  origin: ['https://stusil.vercel.app', 'http://localhost:8080', 'http://localhost:5000'],
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Stricter limit for login/signup
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// App-wide limiter
app.use('/api/', limiter);

// Sockets
initSockets(io);

// API Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/collab', collabRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/startups', startupRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/connections', connectionRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/community', communityRoutes);

// Base route
app.get('/', (req, res) => {
  res.send({ message: 'Stusil API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something broke!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
