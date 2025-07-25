const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const userRoutes = require('./routes/users');
const tourRoutes = require('./routes/tours');
const conversationalRoutes = require('./routes/conversational');
const assistantRoutes = require('./routes/assistant');
const watsonDiscovery = require('./services/watsonDiscovery');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-frontend-domain.com' 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'RealtorBot Backend'
  });
});

// Test Watsonx Discovery connection
app.get('/test-watson', async (req, res) => {
  try {
    console.log('Testing Watsonx Discovery connection...');
    
    // Test connection
    const connectionTest = await watsonDiscovery.testConnection();
    console.log('Connection test result:', connectionTest);
    
    if (!connectionTest.success) {
      return res.status(500).json({ 
        error: 'Watsonx Discovery connection failed',
        details: connectionTest.error
      });
    }
    
    // Try to create collections if they don't exist
    console.log('Creating collections...');
    const usersCollection = await watsonDiscovery.ensureUsersCollection();
    const propertiesCollection = await watsonDiscovery.ensurePropertiesCollection();
    const toursCollection = await watsonDiscovery.ensureToursCollection();
    
    console.log('Users collection result:', usersCollection);
    console.log('Properties collection result:', propertiesCollection);
    console.log('Tours collection result:', toursCollection);
    
    res.json({
      message: 'Watsonx Discovery test completed',
      connection: connectionTest.success,
      collections: {
        users: usersCollection.success,
        properties: propertiesCollection.success,
        tours: toursCollection.success
      }
    });
    
  } catch (error) {
    console.error('Watsonx Discovery test error:', error);
    res.status(500).json({ 
      error: 'Watsonx Discovery test failed',
      details: error.message
    });
  }
});

// Test Watsonx Assistant connection
app.get('/test-assistant', async (req, res) => {
  try {
    console.log('Testing Watsonx Assistant connection...');
    
    const watsonAssistant = require('./services/watsonAssistant');
    
    // Test session creation
    const sessionResult = await watsonAssistant.createSession();
    console.log('Session creation result:', sessionResult);
    
    if (!sessionResult.success) {
      return res.status(500).json({ 
        error: 'Watsonx Assistant session creation failed',
        details: sessionResult.error
      });
    }
    
    // Test sending a simple message
    const messageResult = await watsonAssistant.sendMessage('Hello', sessionResult.sessionId);
    console.log('Message result:', messageResult);
    
    // Clean up session
    await watsonAssistant.deleteSession(sessionResult.sessionId);
    
    res.json({
      message: 'Watsonx Assistant test completed',
      sessionCreation: sessionResult.success,
      messageSending: messageResult.success,
      sessionId: sessionResult.sessionId,
      assistantResponse: messageResult.success ? messageResult.response : null
    });
    
  } catch (error) {
    console.error('Watsonx Assistant test error:', error);
    res.status(500).json({ 
      error: 'Watsonx Assistant test failed',
      details: error.message
    });
  }
});

// Test Watsonx Assistant message (without authentication)
app.post('/test-assistant-message', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log('Testing Watsonx Assistant message:', message);
    
    const watsonAssistant = require('./services/watsonAssistant');
    
    // Create session
    const sessionResult = await watsonAssistant.createSession();
    if (!sessionResult.success) {
      return res.status(500).json({ 
        error: 'Session creation failed',
        details: sessionResult.error
      });
    }
    
    // Send message
    const messageResult = await watsonAssistant.sendMessage(message, sessionResult.sessionId);
    
    // Clean up session
    await watsonAssistant.deleteSession(sessionResult.sessionId);
    
    res.json({
      message: 'Watsonx Assistant message test completed',
      sessionId: sessionResult.sessionId,
      success: messageResult.success,
      response: messageResult.success ? messageResult.response : null,
      error: messageResult.success ? null : messageResult.error
    });
    
  } catch (error) {
    console.error('Watsonx Assistant message test error:', error);
    res.status(500).json({ 
      error: 'Watsonx Assistant message test failed',
      details: error.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/conversational', conversationalRoutes);
app.use('/api/assistant', assistantRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Watsonx Discovery URL: ${process.env.WATSON_DISCOVERY_URL}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Watson test: http://localhost:${PORT}/test-watson`);
}); 