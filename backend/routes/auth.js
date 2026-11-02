const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const DEMO_USERS = [
  {
    name: 'Dr. Priya Sharma',
    email: 'admin@health.gov',
    password: 'admin123',
    role: 'admin',
    village: 'District HQ',
    phone: '+91-9876543210',
  },
  {
    name: 'Anita Devi',
    email: 'worker@health.gov',
    password: 'admin123',
    role: 'field_worker',
    village: 'Rampur',
    phone: '+91-9876543211',
  },
  {
    name: 'Ramu Singh',
    email: 'user@village.in',
    password: 'admin123',
    role: 'public',
    village: 'Ganeshpur',
    phone: '+91-9876543212',
  },
];

const seedDemoUsers = async () => {
  try {
    for (const demoUser of DEMO_USERS) {
      const exists = await User.findOne({ email: demoUser.email });
      if (!exists) {
        await User.create(demoUser);
        console.log(`Seeded demo user: ${demoUser.email}`);
      }
    }
  } catch (error) {
    console.error('Error seeding demo users:', error.message);
  }
};

const signToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id || 'demo_id', email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'smart_health_jwt_secret_key_2026_production',
    { expiresIn: '7d' }
  );
};

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, village, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role: role || 'public', village, phone });
    const token = signToken(user);
    res.status(201).json({ token, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // 1. Try to find user in DB with a short timeout to prevent hanging if DB is down
    let user = null;
    try {
      user = await User.findOne({ email }).select('+password').maxTimeMS(2000);
    } catch (dbError) {
      console.warn('DB search failed, falling back to demo check:', dbError.message);
    }

    // 2. If user found in DB, compare password
    if (user) {
      const isMatch = await user.comparePassword(password);
      if (isMatch) {
        user.lastLogin = new Date();
        await user.save().catch(() => {});
        const token = signToken(user);
        return res.json({ token, user: user.toJSON() });
      }
    }

    // 3. Fallback: Check hardcoded demo users (allows login even if DB is down)
    const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (demoUser) {
      const token = signToken(demoUser);
      // Create a plain object that mimics the User model's structure
      const userObj = { ...demoUser };
      delete userObj.password;
      userObj._id = 'demo_' + demoUser.role;
      return res.json({ token, user: userObj });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/auth/me
router.get('/me', require('../middleware/auth').protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
module.exports.seedDemoUsers = seedDemoUsers;
