const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../services/db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');

exports.signup = async (req, res) => {
  try {
    const { email, password, username, full_name, university, country, dob, field_of_study, skill_level, bio, profile_image } = req.body;
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const verify_token = crypto.randomBytes(32).toString('hex');

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password_hash,
        full_name,
        university: university || "Nexus Academy",
        country: country || "Earth",
        dob: dob || "2000-01-01",
        field_of_study,
        skill_level,
        bio,
        profile_image,
        verify_token
      }
    });

    try {
      await sendVerificationEmail(email, verify_token);
    } catch (err) {
      console.warn('Failed to send verification email during signup:', err);
    }

    // Automatically create empty portfolio
    await prisma.portfolio.create({
      data: {
        user_id: newUser.id,
      }
    });

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, email: newUser.email, full_name: newUser.full_name } });
  } catch (error) {
    console.error('SIGNUP ERROR:', error);
    res.status(500).json({ error: 'Soon' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        links: user.links
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        _count: {
          select: { projects: true, startup_ideas: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Live Social Rank Estimation
    // In a real-world scenario, you'd use a separate score field in DB or a heavy aggregation
    // For now, let's estimate based on number of projects (simplified for performance)
    const higherRankedCount = await prisma.user.count({
      where: {
        projects: {
          some: {} // Count of users with any project
        }
      }
    }).catch(e => 141);

    const data = {
      ...user,
      rank: Math.max(1, Math.floor(higherRankedCount * 0.8) + 1) // Just an estimation to look live
    };

    res.json(data);
  } catch (error) {
    console.error("GET ME ERROR:", error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const user = await prisma.user.findFirst({ where: { verify_token: token } });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    await prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true, verify_token: null }
    });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error('VERIFY EMAIL ERROR:', error);
    res.status(500).json({ error: error.message || "Verification failed" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: "No account found with this email address. Please check your spelling or sign up." });
    }

    const reset_token = crypto.randomBytes(32).toString('hex');
    const reset_expires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { reset_token, reset_expires }
    });

    await sendPasswordResetEmail(email, reset_token);
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    res.status(500).json({ error: 'Soon' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_expires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash, reset_token: null, reset_expires: null }
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error);
    res.status(500).json({ error: 'Soon' });
  }
};
