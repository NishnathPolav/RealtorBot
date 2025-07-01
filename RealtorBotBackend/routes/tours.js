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
      property_address: hit._source.property_address,
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

    console.log('Tour found:', { id: tour.id, property_address: tour.property_address });

    res.json({
      id: tour.id,
      property_address: tour.property_address,
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
    const { property_address, scheduled_date, scheduled_time, notes = '' } = req.body;
    console.log('Create tour attempt:', { property_address, scheduled_date, scheduled_time, buyer_id: req.user.id });

    if (!property_address || !scheduled_date || !scheduled_time) {
      console.log('Missing required fields:', { property_address: !!property_address, scheduled_date: !!scheduled_date, scheduled_time: !!scheduled_time });
      return res.status(400).json({ error: 'Property address, scheduled date, and scheduled time are required' });
    }

    // Create tour document
    const newTour = {
      id: Date.now().toString(),
      property_address,
      scheduled_date,
      scheduled_time,
      notes,
      status: 'scheduled',
      buyer_id: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating new tour:', { id: newTour.id, property_address: newTour.property_address });

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

    console.log('Tour created successfully:', { id: newTour.id, property_address: newTour.property_address });

    res.status(201).json({
      message: 'Tour scheduled successfully',
      tour: {
        id: newTour.id,
        property_address: newTour.property_address,
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
        property_address: updatedTour.property_address,
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

module.exports = router; 