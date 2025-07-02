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

// Get all properties (with optional search and filters)
router.get('/', async (req, res) => {
  try {
    const { 
      search = '', 
      page = 1, 
      size = 10,
      price_min,
      price_max,
      status = 'active'
    } = req.query;

    let result;
    
    if (search) {
      // Search with filters
      const filters = {
        status,
        price_min: price_min ? parseInt(price_min) : null,
        price_max: price_max ? parseInt(price_max) : null
      };
      
      result = await watsonDiscovery.searchDocuments(
        process.env.PROPERTIES_COLLECTION,
        search,
        filters
      );
    } else {
      // Get all properties with pagination
      result = await watsonDiscovery.getAllDocuments(
        process.env.PROPERTIES_COLLECTION,
        parseInt(page),
        parseInt(size)
      );
    }

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to fetch properties' });
    }

    const properties = result.data.hits.hits.hits.map(hit => ({
      id: hit._source.id,
      title: hit._source.title,
      street: hit._source.street,
      city: hit._source.city,
      state: hit._source.state,
      zip: hit._source.zip,
      price: hit._source.price,
      description: hit._source.description,
      status: hit._source.status,
      seller_id: hit._source.seller_id,
      created_at: hit._source.created_at
    }));

    res.json({
      properties,
      total: result.data.hits.total.value,
      page: parseInt(page),
      size: parseInt(size)
    });

  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Get property request:', { id, type: typeof id });

    const result = await watsonDiscovery.getDocument(
      process.env.PROPERTIES_COLLECTION,
      id
    );

    console.log('Get document result:', result);

    if (!result.success) {
      console.log('Property not found in Watsonx Discovery');
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = result.data._source;
    console.log('Property found:', { id: property.id, title: property.title });

    res.json({
      id: property.id,
      title: property.title,
      street: property.street,
      city: property.city,
      state: property.state,
      zip: property.zip,
      price: property.price,
      description: property.description,
      status: property.status,
      seller_id: property.seller_id,
      features: property.features || [],
      created_at: property.created_at,
      updated_at: property.updated_at
    });

  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Failed to fetch property', details: error.message });
  }
});

// Create new property (requires authentication)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, street, city, state, zip, price, description, features = [] } = req.body;
    console.log('Create property attempt:', { title, street, city, state, zip, price, seller_id: req.user.id });

    if (!title || !street || !city || !state || !zip || !price) {
      console.log('Missing required fields:', { title: !!title, street: !!street, city: !!city, state: !!state, zip: !!zip, price: !!price });
      return res.status(400).json({ error: 'Title, street, city, state, zip, and price are required' });
    }

    // Create property document
    const newProperty = {
      id: Date.now().toString(),
      title,
      street,
      city,
      state,
      zip,
      price: parseInt(price),
      description: description || '',
      features,
      status: 'active',
      seller_id: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating new property:', { id: newProperty.id, title: newProperty.title });

    // Index property in Watsonx Discovery
    const result = await watsonDiscovery.indexDocument(
      process.env.PROPERTIES_COLLECTION,
      newProperty
    );

    console.log('Index property result:', result);

    if (!result.success) {
      console.error('Failed to create property in Watsonx Discovery:', result.error);
      return res.status(500).json({ error: 'Failed to create property' });
    }

    console.log('Property created successfully:', { id: newProperty.id, title: newProperty.title });

    res.status(201).json({
      message: 'Property created successfully',
      property: {
        id: newProperty.id,
        title: newProperty.title,
        street: newProperty.street,
        city: newProperty.city,
        state: newProperty.state,
        zip: newProperty.zip,
        price: newProperty.price,
        description: newProperty.description,
        status: newProperty.status,
        seller_id: newProperty.seller_id
      }
    });

  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Failed to create property', details: error.message });
  }
});

// Update property (requires authentication and ownership)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get the property first to check ownership
    const propertyResult = await watsonDiscovery.getDocument(
      process.env.PROPERTIES_COLLECTION,
      id
    );

    if (!propertyResult.success) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = propertyResult.data._source;

    // Check if user owns this property
    if (property.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this property' });
    }

    // Prepare updates
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Update property in Watsonx Discovery
    const result = await watsonDiscovery.updateDocument(
      process.env.PROPERTIES_COLLECTION,
      id,
      updateData
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to update property' });
    }

    res.json({
      message: 'Property updated successfully',
      property: {
        id,
        ...updates,
        updated_at: updateData.updated_at
      }
    });

  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property (requires authentication and ownership)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the property first to check ownership
    const propertyResult = await watsonDiscovery.getDocument(
      process.env.PROPERTIES_COLLECTION,
      id
    );

    if (!propertyResult.success) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = propertyResult.data._source;

    // Check if user owns this property
    if (property.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this property' });
    }

    // Delete property from Watsonx Discovery
    const result = await watsonDiscovery.deleteDocument(
      process.env.PROPERTIES_COLLECTION,
      id
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to delete property' });
    }

    res.json({
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Get properties by seller (requires authentication)
router.get('/seller/my-properties', verifyToken, async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query;
    console.log('Fetching properties for seller:', req.user.id);

    // Use a direct search with seller_id filter instead of searchDocuments
    const searchBody = {
      query: {
        bool: {
          must: [
            { match_all: {} }  // Match all documents
          ],
          filter: [
            { term: { seller_id: req.user.id } }  // Filter by seller_id
          ]
        }
      },
      sort: [
        { 'created_at': { order: 'desc' } }
      ],
      size: parseInt(size),
      from: (parseInt(page) - 1) * parseInt(size)
    };

    console.log('Search body for seller properties:', JSON.stringify(searchBody, null, 2));

    const response = await watsonDiscovery.client.post(
      `/${process.env.PROPERTIES_COLLECTION}/_search`,
      searchBody
    );

    console.log('Search response for seller properties:', {
      total: response.data.hits.total.value,
      hits: response.data.hits.hits.length
    });

    const properties = response.data.hits.hits.map(hit => ({
      id: hit._source.id,
      title: hit._source.title,
      street: hit._source.street,
      city: hit._source.city,
      state: hit._source.state,
      zip: hit._source.zip,
      price: hit._source.price,
      description: hit._source.description,
      status: hit._source.status,
      created_at: hit._source.created_at
    }));

    console.log('Returning properties:', properties.length);

    res.json({
      properties,
      total: response.data.hits.total.value
    });

  } catch (error) {
    console.error('Get seller properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

module.exports = router; 