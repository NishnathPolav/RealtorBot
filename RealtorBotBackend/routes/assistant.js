const express = require('express');
const jwt = require('jsonwebtoken');
const watsonAssistant = require('../services/watsonAssistant');
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

// Create a new assistant session
router.post('/session', verifyToken, async (req, res) => {
  try {
    const result = await watsonAssistant.createSession();
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      sessionId: result.sessionId
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create assistant session' });
  }
});

// Send a message to the assistant
router.post('/message', verifyToken, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Assistant message request:', {
      user_id: req.user.id,
      user_role: req.user.role,
      message: message,
      sessionId: sessionId
    });

    // Send message to Watsonx Assistant
    const result = await watsonAssistant.sendMessage(message, sessionId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    const assistantResponse = result.response;
    const responseText = assistantResponse.output.generic?.[0]?.text || 'I apologize, but I couldn\'t process your request.';
    
    // Check if the assistant wants to perform an action
    const actions = assistantResponse.output.actions || [];
    let actionResults = [];

    for (const action of actions) {
      if (action.name === 'search_properties' && req.user.role === 'buyer') {
        // Handle property search action
        const searchResult = await handlePropertySearch(action.parameters, req.user);
        actionResults.push({
          action: 'search_properties',
          result: searchResult
        });
      } else if (action.name === 'create_listing' && req.user.role === 'seller') {
        // Handle listing creation action
        const createResult = await handleCreateListing(action.parameters, req.user);
        actionResults.push({
          action: 'create_listing',
          result: createResult
        });
      }
    }

    res.json({
      success: true,
      response: responseText,
      sessionId: result.sessionId,
      actions: actionResults,
      context: assistantResponse.context
    });

  } catch (error) {
    console.error('Assistant message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Delete assistant session
router.delete('/session/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await watsonAssistant.deleteSession(sessionId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete assistant session' });
  }
});

// Helper function to handle property search action
async function handlePropertySearch(parameters, user) {
  try {
    const { budget, location, bedrooms, bathrooms, features } = parameters;
    
    // Build search query based on parameters
    let searchQuery = '';
    let filters = { status: 'active' };

    if (location) {
      searchQuery += location + ' ';
    }

    if (features) {
      searchQuery += features + ' ';
    }

    if (budget) {
      const budgetNum = parseInt(budget.toString().replace(/[^0-9]/g, ''));
      if (budgetNum) {
        filters.price_max = budgetNum;
      }
    }

    if (bedrooms) {
      const bedroomNum = parseInt(bedrooms);
      if (bedroomNum) {
        filters.bedrooms_min = bedroomNum;
      }
    }

    if (bathrooms) {
      const bathroomNum = parseInt(bathrooms);
      if (bathroomNum) {
        filters.bathrooms_min = bathroomNum;
      }
    }

    // Search for properties
    const result = await watsonDiscovery.searchDocuments(
      process.env.PROPERTIES_COLLECTION,
      searchQuery || 'property',
      filters
    );

    if (!result.success) {
      return { success: false, error: 'Failed to search properties' };
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

    return {
      success: true,
      properties: sortedProperties,
      total: result.data.hits.total.value
    };

  } catch (error) {
    console.error('Property search action error:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to handle listing creation action
async function handleCreateListing(parameters, user) {
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
    } = parameters;

    // Build address string
    const address = [street, city, state, zip].filter(Boolean).join(', ');

    // Validate required fields
    if (!propertyType || !street || !city || !state || !zip || !price) {
      return { 
        success: false, 
        error: 'Property type, street, city, state, zip, and price are required' 
      };
    }

    // Clean and validate price
    const cleanPrice = parseInt(price.toString().replace(/[^0-9]/g, ''));
    if (!cleanPrice || cleanPrice <= 0) {
      return { success: false, error: 'Invalid price provided' };
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
      features: [],
      status: 'active',
      seller_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Index property in Watsonx Discovery
    const result = await watsonDiscovery.indexDocument(
      process.env.PROPERTIES_COLLECTION,
      newProperty
    );

    if (!result.success) {
      return { success: false, error: 'Failed to create property listing' };
    }

    return {
      success: true,
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
    };

  } catch (error) {
    console.error('Create listing action error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = router; 