const express = require('express');
const jwt = require('jsonwebtoken');
const watsonDiscovery = require('../services/watsonDiscovery');

const router = express.Router();

// Middleware to verify JWT token
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

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await watsonDiscovery.getDocument(
      process.env.USERS_COLLECTION,
      req.user.id
    );

    if (!result.success) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.data._source;

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      preferences: user.preferences || {},
      created_at: user.created_at,
      updated_at: user.updated_at
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { preferences, role } = req.body;

    // Prepare updates
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (preferences) {
      updateData.preferences = preferences;
    }

    if (role) {
      updateData.role = role;
    }

    // Update user in Watsonx Discovery
    const result = await watsonDiscovery.updateDocument(
      process.env.USERS_COLLECTION,
      req.user.id,
      updateData
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to update user profile' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: role || req.user.role,
        preferences: preferences || {},
        updated_at: updateData.updated_at
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user preferences (for buyers)
router.get('/preferences', verifyToken, async (req, res) => {
  try {
    const result = await watsonDiscovery.getDocument(
      process.env.USERS_COLLECTION,
      req.user.id
    );

    if (!result.success) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.data._source;

    res.json({
      preferences: user.preferences || {}
    });

  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch user preferences' });
  }
});

// Update user preferences (for buyers)
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ error: 'Preferences are required' });
    }

    // Update user preferences in Watsonx Discovery
    const result = await watsonDiscovery.updateDocument(
      process.env.USERS_COLLECTION,
      req.user.id,
      {
        preferences,
        updated_at: new Date().toISOString()
      }
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to update user preferences' });
    }

    res.json({
      message: 'Preferences updated successfully',
      preferences
    });

  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

// Get suggested properties based on user preferences (for buyers)
router.get('/suggestions', verifyToken, async (req, res) => {
  try {
    // Get user preferences
    const userResult = await watsonDiscovery.getDocument(
      process.env.USERS_COLLECTION,
      req.user.id
    );

    if (!userResult.success) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.data._source;
    const preferences = user.preferences || {};

    // Build search query based on preferences
    let searchQuery = '';
    let filters = { status: 'active' };

    if (preferences.price_range) {
      filters.price_min = preferences.price_range[0];
      filters.price_max = preferences.price_range[1];
    }

    if (preferences.locations && preferences.locations.length > 0) {
      searchQuery = preferences.locations.join(' ');
    }

    if (preferences.property_types && preferences.property_types.length > 0) {
      searchQuery += ' ' + preferences.property_types.join(' ');
    }

    // Search for properties
    const result = await watsonDiscovery.searchDocuments(
      process.env.PROPERTIES_COLLECTION,
      searchQuery,
      filters
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to fetch suggestions' });
    }

    const suggestions = result.data.hits.hits.map(hit => ({
      id: hit._source.id,
      title: hit._source.title,
      address: hit._source.address,
      price: hit._source.price,
      description: hit._source.description,
      score: hit._score
    }));

    res.json({
      suggestions,
      total: result.data.hits.total.value
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Change user role
router.put('/role', verifyToken, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ error: 'Valid role (buyer or seller) is required' });
    }

    // Update user role in Watsonx Discovery
    const result = await watsonDiscovery.updateDocument(
      process.env.USERS_COLLECTION,
      req.user.id,
      {
        role,
        updated_at: new Date().toISOString()
      }
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to update user role' });
    }

    // Generate new token with updated role
    const newToken = jwt.sign(
      { 
        id: req.user.id, 
        email: req.user.email, 
        role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Role updated successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        role
      },
      token: newToken
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router; 