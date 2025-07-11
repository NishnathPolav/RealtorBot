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

// Get all tours for a buyer (requires authentication)
router.get('/buyer/my-tours', verifyToken, async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query;
    console.log('Fetching tours for buyer:', req.user.id);
    console.log('User object from token:', req.user);

    // Ensure tours collection exists
    console.log('Ensuring tours collection exists...');
    const collectionResult = await watsonDiscovery.ensureToursCollection();
    console.log('Tours collection ensure result:', collectionResult);
    
    // Continue even if collection already exists (that's fine)
    if (!collectionResult.success && !collectionResult.exists) {
      console.error('Failed to ensure tours collection exists');
      return res.status(500).json({ error: 'Failed to initialize tour system' });
    }

    // Search for tours by buyer_id
    const searchBody = {
      query: {
        bool: {
          must: [
            { match_all: {} }  // Match all documents
          ],
          filter: [
            { term: { buyer_id: req.user.id } }  // Filter by buyer_id
          ]
        }
      },
      sort: [
        { 'scheduled_date': { order: 'asc' } }
      ],
      size: parseInt(size),
      from: (parseInt(page) - 1) * parseInt(size)
    };

    console.log('Search body for buyer tours:', JSON.stringify(searchBody, null, 2));

    const response = await watsonDiscovery.client.post(
      `/${process.env.TOURS_COLLECTION}/_search`,
      searchBody
    );

    console.log('Search response for buyer tours:', {
      total: response.data.hits.total.value,
      hits: response.data.hits.hits.length
    });

    const tours = response.data.hits.hits.map(hit => ({
      id: hit._source.id,
      street: hit._source.street,
      city: hit._source.city,
      state: hit._source.state,
      zip: hit._source.zip,
      scheduled_date: hit._source.scheduled_date,
      scheduled_time: hit._source.scheduled_time,
      status: hit._source.status,
      notes: hit._source.notes,
      created_at: hit._source.created_at
    }));

    console.log('Returning tours:', tours.length);

    res.json({
      tours,
      total: response.data.hits.total.value
    });

  } catch (error) {
    console.error('Get buyer tours error:', error);
    res.status(500).json({ error: 'Failed to fetch tours' });
  }
});

// Get tour by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Get tour request:', { id, type: typeof id });

    const result = await watsonDiscovery.getDocument(
      process.env.TOURS_COLLECTION,
      id
    );

    console.log('Get tour document result:', result);

    if (!result.success) {
      console.log('Tour not found in Watsonx Discovery');
      return res.status(404).json({ error: 'Tour not found' });
    }

    const tour = result.data._source;
    
    // Check if user owns this tour
    if (tour.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this tour' });
    }

    console.log('Tour found:', { id: tour.id, street: tour.street, city: tour.city, state: tour.state, zip: tour.zip });

    res.json({
      id: tour.id,
      street: tour.street,
      city: tour.city,
      state: tour.state,
      zip: tour.zip,
      scheduled_date: tour.scheduled_date,
      scheduled_time: tour.scheduled_time,
      status: tour.status,
      notes: tour.notes,
      buyer_id: tour.buyer_id,
      created_at: tour.created_at,
      updated_at: tour.updated_at
    });

  } catch (error) {
    console.error('Get tour error:', error);
    res.status(500).json({ error: 'Failed to fetch tour', details: error.message });
  }
});

// Create new tour (requires authentication)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { street, city, state, zip, scheduled_date, scheduled_time, notes = '' } = req.body;
    console.log('Create tour attempt:', { street, city, state, zip, scheduled_date, scheduled_time, buyer_id: req.user.id });
    console.log('User object from token:', req.user);

    if (!street || !city || !state || !zip || !scheduled_date || !scheduled_time) {
      console.log('Missing required fields:', { street: !!street, city: !!city, state: !!state, zip: !!zip, scheduled_date: !!scheduled_date, scheduled_time: !!scheduled_time });
      return res.status(400).json({ error: 'Street, city, state, zip, scheduled date, and scheduled time are required' });
    }

    // Ensure tours collection exists
    console.log('Ensuring tours collection exists...');
    const collectionResult = await watsonDiscovery.ensureToursCollection();
    console.log('Tours collection ensure result:', collectionResult);
    
    // Continue even if collection already exists (that's fine)
    if (!collectionResult.success && !collectionResult.exists) {
      console.error('Failed to ensure tours collection exists');
      return res.status(500).json({ error: 'Failed to initialize tour system' });
    }

    // Create tour document
    const newTour = {
      id: Date.now().toString(),
      street,
      city,
      state,
      zip,
      scheduled_date,
      scheduled_time,
      notes,
      status: 'scheduled',
      buyer_id: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating new tour:', { id: newTour.id, street: newTour.street, city: newTour.city, state: newTour.state, zip: newTour.zip });

    // Index tour in Watsonx Discovery
    const result = await watsonDiscovery.indexDocument(
      process.env.TOURS_COLLECTION,
      newTour
    );

    console.log('Index tour result:', result);

    if (!result.success) {
      console.error('Failed to create tour in Watsonx Discovery:', result.error);
      return res.status(500).json({ error: 'Failed to create tour' });
    }

    console.log('Tour created successfully:', { id: newTour.id, street: newTour.street, city: newTour.city, state: newTour.state, zip: newTour.zip });

    res.status(201).json({
      message: 'Tour scheduled successfully',
      tour: {
        id: newTour.id,
        street: newTour.street,
        city: newTour.city,
        state: newTour.state,
        zip: newTour.zip,
        scheduled_date: newTour.scheduled_date,
        scheduled_time: newTour.scheduled_time,
        status: newTour.status,
        notes: newTour.notes,
        buyer_id: newTour.buyer_id
      }
    });

  } catch (error) {
    console.error('Create tour error:', error);
    res.status(500).json({ error: 'Failed to schedule tour', details: error.message });
  }
});

// Update tour (requires authentication and ownership)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get the tour first to check ownership
    const tourResult = await watsonDiscovery.getDocument(
      process.env.TOURS_COLLECTION,
      id
    );

    if (!tourResult.success) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    const tour = tourResult.data._source;

    // Check if user owns this tour
    if (tour.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this tour' });
    }

    // Update tour document
    const updatedTour = {
      ...tour,
      ...updates,
      updated_at: new Date().toISOString()
    };

    console.log('Updating tour:', { id, updates });

    // Update tour in Watsonx Discovery
    const result = await watsonDiscovery.indexDocument(
      process.env.TOURS_COLLECTION,
      updatedTour
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to update tour' });
    }

    res.json({
      message: 'Tour updated successfully',
      tour: {
        id: updatedTour.id,
        street: updatedTour.street,
        city: updatedTour.city,
        state: updatedTour.state,
        zip: updatedTour.zip,
        scheduled_date: updatedTour.scheduled_date,
        scheduled_time: updatedTour.scheduled_time,
        status: updatedTour.status,
        notes: updatedTour.notes,
        buyer_id: updatedTour.buyer_id
      }
    });

  } catch (error) {
    console.error('Update tour error:', error);
    res.status(500).json({ error: 'Failed to update tour' });
  }
});

// Delete tour (requires authentication and ownership)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the tour first to check ownership
    const tourResult = await watsonDiscovery.getDocument(
      process.env.TOURS_COLLECTION,
      id
    );

    if (!tourResult.success) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    const tour = tourResult.data._source;

    // Check if user owns this tour
    if (tour.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this tour' });
    }

    // Delete tour from Watsonx Discovery
    const result = await watsonDiscovery.deleteDocument(
      process.env.TOURS_COLLECTION,
      id
    );

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to delete tour' });
    }

    res.json({
      message: 'Tour deleted successfully'
    });

  } catch (error) {
    console.error('Delete tour error:', error);
    res.status(500).json({ error: 'Failed to delete tour' });
  }
});

// Test endpoint to check tours collection
router.get('/test', async (req, res) => {
  try {
    console.log('Testing tours collection...');
    
    // Ensure tours collection exists
    const collectionResult = await watsonDiscovery.ensureToursCollection();
    console.log('Tours collection test result:', collectionResult);
    
    // Try to search for any tours
    const searchBody = {
      query: {
        match_all: {}
      },
      size: 1
    };
    
    const response = await watsonDiscovery.client.post(
      `/${process.env.TOURS_COLLECTION}/_search`,
      searchBody
    );
    
    console.log('Tours search test result:', {
      total: response.data.hits.total.value,
      hits: response.data.hits.hits.length
    });
    
    res.json({
      message: 'Tours collection test completed',
      collection: collectionResult.success,
      totalTours: response.data.hits.total.value
    });
    
  } catch (error) {
    console.error('Tours test error:', error);
    res.status(500).json({ 
      error: 'Tours test failed',
      details: error.message
    });
  }
});

// Test endpoint to create a sample tour
router.post('/test-create', async (req, res) => {
  try {
    console.log('Creating test tour...');
    
    // Ensure tours collection exists
    const collectionResult = await watsonDiscovery.ensureToursCollection();
    console.log('Tours collection ensure result:', collectionResult);
    
    // Create a test tour
    const testTour = {
      id: Date.now().toString(),
      street: '123 Test Street',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      scheduled_date: '2024-01-15',
      scheduled_time: '2:00 PM',
      notes: 'This is a test tour',
      status: 'scheduled',
      buyer_id: 'test-buyer-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Creating test tour:', testTour);
    
    // Index tour in Watsonx Discovery
    const result = await watsonDiscovery.indexDocument(
      process.env.TOURS_COLLECTION,
      testTour
    );
    
    console.log('Test tour creation result:', result);
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to create test tour' });
    }
    
    res.json({
      message: 'Test tour created successfully',
      tour: testTour
    });
    
  } catch (error) {
    console.error('Test tour creation error:', error);
    res.status(500).json({ 
      error: 'Test tour creation failed',
      details: error.message
    });
  }
});

module.exports = router; 