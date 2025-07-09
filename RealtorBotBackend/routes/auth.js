const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Added for password hashing
const watsonDiscovery = require('../services/watsonDiscovery');

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper function to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Registration attempt:', { email, role });

    if (!email || !password || !role) {
      console.log('Missing required fields:', { email: !!email, password: !!password, role: !!role });
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    // Ensure users collection exists
    console.log('Ensuring users collection exists...');
    const collectionResult = await watsonDiscovery.ensureUsersCollection();
    console.log('Collection ensure result:', collectionResult);
    
    // Continue even if collection already exists (that's fine)
    if (!collectionResult.success && !collectionResult.exists) {
      console.error('Failed to ensure users collection exists');
      return res.status(500).json({ error: 'Failed to initialize user system' });
    }

    // Check if user already exists - use exact email matching
    console.log('Checking if user exists...');
    const existingUser = await watsonDiscovery.searchUserByEmail(
      process.env.USERS_COLLECTION,
      email
    );

    console.log('Existing user search result:', existingUser);

    if (existingUser.success && existingUser.data.hits.total.value > 0) {
      // Filter results to check for exact email match since match query can return fuzzy results
      const exactMatches = existingUser.data.hits.hits.filter(
        hit => hit._source.email.toLowerCase() === email.toLowerCase()
      );
      
      if (exactMatches.length > 0) {
        console.log('User already exists with exact email match');
        return res.status(409).json({ error: 'User with this email already exists' });
      }
    }

    // Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user document
    const newUser = {
      id: Date.now().toString(),
      email: email.toLowerCase(), // Normalize email to lowercase
      password: hashedPassword, // Store hashed password
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating new user:', { id: newUser.id, email: newUser.email, role: newUser.role });

    // Index user in Watsonx Discovery
    const result = await watsonDiscovery.indexDocument(
      process.env.USERS_COLLECTION,
      newUser
    );

    console.log('Index document result:', result);

    if (!result.success) {
      console.error('Failed to create user in Watsonx Discovery:', result.error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = generateToken(newUser);

    console.log('User created successfully:', { id: newUser.id, email: newUser.email });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password: password ? '[REDACTED]' : undefined, passwordType: typeof password });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Normalize email to lowercase for consistent matching
    const normalizedEmail = email.toLowerCase();
    console.log('Normalized email:', normalizedEmail);

    // Search for user in Watsonx Discovery
    const result = await watsonDiscovery.searchUserByEmail(
      process.env.USERS_COLLECTION,
      normalizedEmail
    );

    console.log('User search result:', result);

    if (!result.success || result.data.hits.total.value === 0) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.data.hits.hits[0]._source;
    console.log('Found user:', { 
      id: user.id, 
      email: user.email, 
      role: user.role
    });

    // Compare hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison:', { match: passwordMatch });

    if (!passwordMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    console.log('Login successful:', { id: user.id, email: user.email });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google OAuth login (mock for now)
router.post('/google', async (req, res) => {
  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // In production, verify the Google token with Google's API
    // For now, we'll mock the Google user data
    const mockGoogleUser = {
      id: Date.now().toString(),
      email: 'user@gmail.com', // This would come from Google
      role: 'buyer', // Default role
      provider: 'google',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if user exists, if not create them
    const existingUser = await watsonDiscovery.searchUserByEmail(
      process.env.USERS_COLLECTION,
      mockGoogleUser.email
    );

    let user;
    if (existingUser.success && existingUser.data.hits.total.value > 0) {
      user = existingUser.data.hits.hits[0]._source;
    } else {
      // Create new user
      const result = await watsonDiscovery.indexDocument(
        process.env.USERS_COLLECTION,
        mockGoogleUser
      );
      
      if (!result.success) {
        return res.status(500).json({ error: 'Failed to create user' });
      }
      
      user = mockGoogleUser;
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: 'Google login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google login failed' });
  }
});

// Verify token
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// Debug endpoint to check users collection
router.get('/debug/users', async (req, res) => {
  try {
    console.log('Debug: Checking users collection...');
    
    // Test connection
    const connectionTest = await watsonDiscovery.testConnection();
    console.log('Connection test:', connectionTest);
    
    // Try to get all users
    const allUsers = await watsonDiscovery.getAllDocuments(process.env.USERS_COLLECTION);
    console.log('All users result:', allUsers);
    
    res.json({
      connection: connectionTest,
      users: allUsers,
      collection: process.env.USERS_COLLECTION
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to recreate users collection
router.post('/debug/recreate-users', async (req, res) => {
  try {
    console.log('Debug: Recreating users collection...');
    
    const result = await watsonDiscovery.recreateUsersCollection();
    
    res.json({
      message: 'Users collection recreated',
      result: result
    });
  } catch (error) {
    console.error('Recreate users endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 