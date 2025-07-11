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

// Get property recommendations based on buyer preferences
router.post('/recommendations', verifyToken, async (req, res) => {
  try {
    const { 
      budget, 
      location, 
      bedrooms, 
      bathrooms, 
      features, 
      timeline 
    } = req.body;

    console.log('Property recommendations request:', {
      user_id: req.user.id,
      preferences: { budget, location, bedrooms, bathrooms, features, timeline }
    });

    // Build search query based on preferences
    let searchQuery = '';
    let filters = { status: 'active' };

    // Add location to search query if provided
    if (location) {
      searchQuery += location + ' ';
    }

    // Add features to search query if provided
    if (features) {
      searchQuery += features + ' ';
    }

    // Add price filter if budget is provided
    if (budget) {
      const budgetNum = parseInt(budget.replace(/[^0-9]/g, ''));
      if (budgetNum) {
        filters.price_max = budgetNum;
      }
    }

    // Add bedroom filter if provided
    if (bedrooms) {
      const bedroomNum = parseInt(bedrooms);
      if (bedroomNum) {
        filters.bedrooms_min = bedroomNum;
      }
    }

    // Add bathroom filter if provided
    if (bathrooms) {
      const bathroomNum = parseInt(bathrooms);
      if (bathroomNum) {
        filters.bathrooms_min = bathroomNum;
      }
    }

    console.log('Search query:', searchQuery);
    console.log('Filters:', filters);

    // Search for properties
    const result = await watsonDiscovery.searchDocuments(
      process.env.PROPERTIES_COLLECTION,
      searchQuery || 'property',
      filters
    );

    if (!result.success) {
      console.error('Failed to search properties:', result.error);
      return res.status(500).json({ error: 'Failed to get property recommendations' });
    }

    // Process and format the results
    const properties = result.data.hits.hits.map(hit => {
      const source = hit._source;
      return {
        id: source.id,
        address: source.address,
        price: `$${source.price.toLocaleString()}`,
        bedrooms: source.bedrooms || 0,
        bathrooms: source.bathrooms || 0,
        sqft: source.squareFootage || 0,
        features: source.features || [],
        description: source.description,
        image: source.image || 'https://via.placeholder.com/300x200',
        score: hit._score
      };
    });

    // Sort by relevance score and limit to top 6
    const sortedProperties = properties
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    console.log(`Found ${sortedProperties.length} matching properties`);

    res.json({
      success: true,
      properties: sortedProperties,
      total: result.data.hits.total.value,
      preferences: { budget, location, bedrooms, bathrooms, features, timeline }
    });

  } catch (error) {
    console.error('Property recommendations error:', error);
    res.status(500).json({ error: 'Failed to get property recommendations' });
  }
});

// Create property listing from conversational input (for sellers)
router.post('/create-listing', verifyToken, async (req, res) => {
  try {
    const { 
      propertyType, 
      street, 
      city, 
      state, 
      zip, 
      price, 
      bedrooms, 
      bathrooms, 
      squareFootage, 
      description 
    } = req.body;

    console.log('Create listing from conversation:', {
      user_id: req.user.id,
      property_details: { propertyType, street, city, state, zip, price, bedrooms, bathrooms, squareFootage }
    });

    // Build address string
    const address = [street, city, state, zip].filter(Boolean).join(', ');

    // Validate required fields
    if (!propertyType || !street || !city || !state || !zip || !price) {
      return res.status(400).json({ 
        error: 'Property type, street, city, state, zip, and price are required' 
      });
    }

    // Clean and validate price
    const cleanPrice = parseInt(price.toString().replace(/[^0-9]/g, ''));
    if (!cleanPrice || cleanPrice <= 0) {
      return res.status(400).json({ error: 'Invalid price provided' });
    }

    // Create property document
    const newProperty = {
      id: Date.now().toString(),
      title: `${propertyType} at ${address}`,
      propertyType: propertyType.toLowerCase(),
      address,
      street,
      city,
      state,
      zip,
      price: cleanPrice,
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseInt(bathrooms) || 0,
      squareFootage: parseInt(squareFootage) || 0,
      description: description || '',
      features: [], // Can be enhanced later
      status: 'active',
      seller_id: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating new property from conversation:', {
      id: newProperty.id,
      title: newProperty.title,
      price: newProperty.price
    });

    // Index property in Watsonx Discovery
    const result = await watsonDiscovery.indexDocument(
      process.env.PROPERTIES_COLLECTION,
      newProperty
    );

    if (!result.success) {
      console.error('Failed to create property in Watsonx Discovery:', result.error);
      return res.status(500).json({ error: 'Failed to create property listing' });
    }

    console.log('Property created successfully from conversation:', {
      id: newProperty.id,
      title: newProperty.title
    });

    res.status(201).json({
      success: true,
      message: 'Property listing created successfully!',
      property: {
        id: newProperty.id,
        title: newProperty.title,
        address: newProperty.address,
        price: `$${newProperty.price.toLocaleString()}`,
        bedrooms: newProperty.bedrooms,
        bathrooms: newProperty.bathrooms,
        squareFootage: newProperty.squareFootage,
        description: newProperty.description,
        status: newProperty.status
      }
    });

  } catch (error) {
    console.error('Create listing from conversation error:', error);
    res.status(500).json({ error: 'Failed to create property listing' });
  }
});

// Get conversation history (optional - for future enhancement)
router.get('/history', verifyToken, async (req, res) => {
  try {
    // This could be implemented to store and retrieve conversation history
    // For now, return empty array
    res.json({
      success: true,
      conversations: []
    });
  } catch (error) {
    console.error('Get conversation history error:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

module.exports = router; 