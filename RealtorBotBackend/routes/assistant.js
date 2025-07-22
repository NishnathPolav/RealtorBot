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
    console.log('Creating new assistant session for user:', req.user.id);
    const result = await watsonAssistant.createSession();
    
    if (!result.success) {
      console.error('Failed to create session:', result.error);
      return res.status(500).json({ error: result.error });
    }

    console.log('Session created successfully:', result.sessionId);
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
      console.error('Assistant message failed:', result.error);
      return res.status(500).json({ error: result.error });
    }

    const assistantResponse = result.response;
    console.log('Assistant response structure:', {
      hasOutput: !!assistantResponse.output,
      hasGeneric: !!(assistantResponse.output && assistantResponse.output.generic),
      hasActions: !!(assistantResponse.output && assistantResponse.output.actions),
      hasContext: !!assistantResponse.context
    });

    // Extract the response text from the assistant
    let responseText = 'I apologize, but I couldn\'t process your request.';
    
    if (assistantResponse.output && assistantResponse.output.generic) {
      const genericResponse = assistantResponse.output.generic.find(item => item.response_type === 'text');
      if (genericResponse) {
        responseText = genericResponse.text;
      }
    }

    // --- Custom formatting for summary confirmation message ---
    // If the responseText matches the summary pattern, reformat it
    if (responseText && responseText.startsWith('Thank you for providing this information.')) {
      // Extract property details using regex
      const regex = /\*\*Property Type\*\*: ([^*]+) \*\*Street\*\*: ([^*]+) \*\*City\*\*: ([^*]+) \*\*State\*\*: ([^*]+) \*\*Zip\*\*: ([^*]+) \*\*Price\*\*: ([^*]+) \*\*Bedrooms\*\*: ([^*]+) \*\*Bathrooms\*\*: ([^*]+) \*\*Square\*\* \*\*Footage\*\*: ([^*]+) \*\*Description\*\*: ([^*]+) Should I proceed to create the listing\? \(Yes\/ No\)/;
      const match = responseText.match(regex);
      if (match) {
        const [_, propertyType, street, city, state, zip, price, bedrooms, bathrooms, squareFootage, description] = match;
        responseText =
          'Thank you for providing this information.\n' +
          `**Property Type**: ${propertyType.trim()}\n` +
          `**Street**: ${street.trim()}\n` +
          `**City**: ${city.trim()}\n` +
          `**State**: ${state.trim()}\n` +
          `**Zip**: ${zip.trim()}\n` +
          `**Price**: ${price.trim()}\n` +
          `**Bedrooms**: ${bedrooms.trim()}\n` +
          `**Bathrooms**: ${bathrooms.trim()}\n` +
          `**Square Footage**: ${squareFootage.trim()}\n` +
          `**Description**: ${description.trim()}\n` +
          'Should I proceed to create the listing? (Yes/ No)';
      }
    }

    // Extract variables from Watsonx Assistant context (root level for Watsonx)
    const userDefined = assistantResponse.context?.global || assistantResponse.context || {};
    const requiredFields = ['propertyType', 'street', 'city', 'state', 'zip', 'price'];
    const hasAllRequired = requiredFields.every(field => userDefined[field]);
    if (hasAllRequired) {
      return res.json({
        success: true,
        response: responseText,
        sessionId: result.sessionId,
        actions: [],
        context: assistantResponse.context,
        sessionVariables: userDefined,
        awaitingConfirmation: true
      });
    }
    // Otherwise, normal response
    res.json({
      success: true,
      response: responseText,
      sessionId: result.sessionId,
      actions: [],
      context: assistantResponse.context,
      sessionVariables: userDefined
    });

  } catch (error) {
    console.error('Assistant message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// New endpoint to create listing from session variables
router.post('/create-listing', verifyToken, async (req, res) => {
  try {
    const variables = req.body;
    const user = req.user;
    // Validate required fields
    const requiredFields = ['propertyType', 'street', 'city', 'state', 'zip', 'price'];
    const hasAllRequired = requiredFields.every(field => variables[field]);
    if (!hasAllRequired) {
      return res.status(400).json({ error: 'Missing required fields for listing creation' });
    }
    const createResult = await handleCreateListing(variables, user);
    if (!createResult.success) {
      return res.status(500).json({ error: createResult.error });
    }
    res.json({
      success: true,
      message: createResult.message,
      property: createResult.property
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create property listing' });
  }
});

// Delete assistant session
router.delete('/session/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('Deleting session:', sessionId);
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
    console.log('Handling property search with parameters:', parameters);
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

    console.log('Search query:', searchQuery);
    console.log('Filters:', filters);

    // Search for properties
    const result = await watsonDiscovery.searchDocuments(
      process.env.PROPERTIES_COLLECTION,
      searchQuery || 'property',
      filters
    );

    if (!result.success) {
      console.error('Property search failed:', result.error);
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

    console.log(`Found ${sortedProperties.length} matching properties`);

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
    console.log('Handling listing creation with parameters:', parameters);
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
      console.error('Missing required fields for listing creation:', {
        propertyType: !!propertyType,
        street: !!street,
        city: !!city,
        state: !!state,
        zip: !!zip,
        price: !!price
      });
      return { 
        success: false, 
        error: 'Property type, street, city, state, zip, and price are required' 
      };
    }

    // Clean and validate price (handle currency format)
    let cleanPrice;
    if (typeof price === 'string') {
      // Remove currency symbols, commas, and spaces
      cleanPrice = parseInt(price.replace(/[$,€£¥\s]/g, ''));
    } else {
      cleanPrice = parseInt(price);
    }
    
    if (!cleanPrice || cleanPrice <= 0) {
      console.error('Invalid price provided:', price);
      return { success: false, error: 'Invalid price provided' };
    }

    // Convert numeric fields to integers
    const cleanBedrooms = bedrooms ? parseInt(bedrooms) : 0;
    const cleanBathrooms = bathrooms ? parseInt(bathrooms) : 0;
    const cleanSquareFootage = squareFootage ? parseInt(squareFootage) : 0;

    // Create property document
    const newProperty = {
      id: Date.now().toString(),
      title: `${propertyType} at ${address}`,
      propertyType: propertyType.toLowerCase(),
      address,
      street: street.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zip: zip.toString().trim(),
      price: cleanPrice,
      bedrooms: cleanBedrooms,
      bathrooms: cleanBathrooms,
      squareFootage: cleanSquareFootage,
      description: description ? description.trim() : '',
      features: [], // Can be enhanced later
      status: 'active',
      seller_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating new property:', {
      id: newProperty.id,
      title: newProperty.title,
      price: newProperty.price,
      address: newProperty.address,
      bedrooms: newProperty.bedrooms,
      bathrooms: newProperty.bathrooms,
      squareFootage: newProperty.squareFootage
    });

    // Index property in Watsonx Discovery
    const result = await watsonDiscovery.indexDocument(
      process.env.PROPERTIES_COLLECTION,
      newProperty
    );

    if (!result.success) {
      console.error('Failed to index property:', result.error);
      return { success: false, error: 'Failed to create property listing' };
    }

    console.log('Property created successfully:', newProperty.id);

    return {
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
    };

  } catch (error) {
    console.error('Create listing action error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = router;
