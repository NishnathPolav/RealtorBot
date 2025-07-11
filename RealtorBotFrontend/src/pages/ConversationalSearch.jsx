import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Chip,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, SmartToy as BotIcon } from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPropertyRecommendations, createListingFromConversation } from '../services/conversationalAPI';

const ConversationalSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationState, setConversationState] = useState('initial');
  const [userPreferences, setUserPreferences] = useState({});
  const [propertyDetails, setPropertyDetails] = useState({});
  const [suggestedProperties, setSuggestedProperties] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const isBuyer = user?.role === 'buyer';
  const isSeller = user?.role === 'seller';

  console.log('ConversationalSearch component loaded');
  console.log('User:', user);
  console.log('isBuyer:', isBuyer, 'isSeller:', isSeller);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation based on user role
  useEffect(() => {
    console.log('Initializing conversation for user role:', user?.role);
    if (isBuyer) {
      console.log('Setting up buyer conversation');
      setMessages([
        {
          id: 1,
          type: 'bot',
          content: `Hello! I'm your AI real estate assistant. I'll help you find your perfect home by asking a few questions. Let's start with the basics - what's your budget range?`,
          timestamp: new Date()
        }
      ]);
      setConversationState('budget');
    } else if (isSeller) {
      console.log('Setting up seller conversation');
      setMessages([
        {
          id: 1,
          type: 'bot',
          content: `Hello! I'm your AI real estate assistant. I'll help you create a listing for your property. Let's start with the property details. What type of property are you selling? (house, apartment, condo, etc.)`,
          timestamp: new Date()
        }
      ]);
      setConversationState('property_type');
    } else {
      console.log('No user role detected, cannot initialize conversation');
    }
  }, [isBuyer, isSeller]);

  const buyerQuestions = {
    budget: {
      question: "What's your budget range?",
      nextState: 'location',
      field: 'budget'
    },
    location: {
      question: "What area or neighborhood are you interested in?",
      nextState: 'bedrooms',
      field: 'location'
    },
    bedrooms: {
      question: "How many bedrooms do you need?",
      nextState: 'bathrooms',
      field: 'bedrooms'
    },
    bathrooms: {
      question: "How many bathrooms do you need?",
      nextState: 'features',
      field: 'bathrooms'
    },
    features: {
      question: "Any specific features you're looking for? (e.g., garage, garden, pool, etc.)",
      nextState: 'timeline',
      field: 'features'
    },
    timeline: {
      question: "What's your timeline for buying? (immediate, 3 months, 6 months, etc.)",
      nextState: 'complete',
      field: 'timeline'
    }
  };

  const sellerQuestions = {
    property_type: {
      question: "What type of property are you selling?",
      nextState: 'street',
      field: 'propertyType'
    },
    street: {
      question: "What's the street address?",
      nextState: 'city',
      field: 'street'
    },
    city: {
      question: "What city is the property in?",
      nextState: 'state',
      field: 'city'
    },
    state: {
      question: "What state is the property in? (e.g., NY, CA)",
      nextState: 'zip',
      field: 'state'
    },
    zip: {
      question: "What's the ZIP code?",
      nextState: 'price',
      field: 'zip'
    },
    price: {
      question: "What's your asking price?",
      nextState: 'bedrooms',
      field: 'price'
    },
    bedrooms: {
      question: "How many bedrooms?",
      nextState: 'bathrooms',
      field: 'bedrooms'
    },
    bathrooms: {
      question: "How many bathrooms?",
      nextState: 'sqft',
      field: 'bathrooms'
    },
    sqft: {
      question: "What's the square footage?",
      nextState: 'description',
      field: 'squareFootage'
    },
    description: {
      question: "Describe your property (features, condition, etc.)",
      nextState: 'complete',
      field: 'description'
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    console.log('handleSendMessage called with:', inputMessage);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    // Simulate AI processing delay
    setTimeout(async () => {
      try {
        console.log('About to call processUserResponse');
        await processUserResponse(inputMessage);
      } catch (error) {
        console.error('Error processing user response:', error);
        setError(error.message);
        
        const errorMessage = {
          id: Date.now(),
          type: 'bot',
          content: `I'm sorry, I encountered an error: ${error.message}. Please try again.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }, 1000);
  };

  const processUserResponse = async (response) => {
    console.log('processUserResponse called with:', response);
    console.log('User role:', user?.role);
    console.log('isBuyer:', isBuyer, 'isSeller:', isSeller);
    
    if (isBuyer) {
      console.log('Processing as buyer');
      await processBuyerResponse(response);
    } else if (isSeller) {
      console.log('Processing as seller');
      await processSellerResponse(response);
    } else {
      console.log('No user role detected');
    }
  };

  const processBuyerResponse = async (response) => {
    const currentQuestion = buyerQuestions[conversationState];
    
    // Store user preference
    setUserPreferences(prev => ({
      ...prev,
      [currentQuestion.field]: response
    }));

    if (conversationState === 'complete') {
      // Get property recommendations from API
      try {
        const result = await getPropertyRecommendations(userPreferences);
        setSuggestedProperties(result.properties || []);
        
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: `Based on your preferences, I found ${result.properties.length} properties that match your criteria:`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setConversationState('suggestions');
      } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
      }
    } else {
      const nextState = currentQuestion.nextState;
      const nextQuestion = buyerQuestions[nextState];
      
      const botMessage = {
        id: Date.now(),
        type: 'bot',
        content: nextQuestion.question,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setConversationState(nextState);
    }
  };

  const processSellerResponse = async (response) => {
    const currentQuestion = sellerQuestions[conversationState];

    // Build the latest property details synchronously
    let latestPropertyDetails = propertyDetails;
    if (currentQuestion) {
      latestPropertyDetails = {
        ...propertyDetails,
        [currentQuestion.field]: response
      };
      setPropertyDetails(latestPropertyDetails); // keep state in sync
    }

    if (conversationState === 'complete') {
      // This should not happen in normal flow, but handle it just in case
      try {
        const result = await createListingFromConversation(latestPropertyDetails);

        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: `Perfect! I've created a listing for your property. Here are the details: ${result.property.title} at ${result.property.address} for ${result.property.price}`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setConversationState('listing_created');
      } catch (error) {
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: `Sorry, I couldn't create the listing: ${error.message}. Please try again or contact support.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setConversationState('initial');
      }
    } else if (currentQuestion) {
      const nextState = currentQuestion.nextState;
      
      if (nextState === 'complete') {
        // This is the last question, create the listing
        try {
          const result = await createListingFromConversation(latestPropertyDetails);

          const botMessage = {
            id: Date.now(),
            type: 'bot',
            content: `Perfect! I've created a listing for your property. Here are the details: ${result.property.title} at ${result.property.address} for ${result.property.price}`,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, botMessage]);
          setConversationState('listing_created');
        } catch (error) {
          const botMessage = {
            id: Date.now(),
            type: 'bot',
            content: `Sorry, I couldn't create the listing: ${error.message}. Please try again or contact support.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
          setConversationState('initial');
        }
      } else if (sellerQuestions[nextState]) {
        const nextQuestion = sellerQuestions[nextState];

        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: nextQuestion.question,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setConversationState(nextState);
      } else {
        setConversationState(nextState);
      }
    }
  };

  const handleViewListing = (listingId) => {
    navigate(`/listing/${listingId}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        AI Property Assistant
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper 
        elevation={3} 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Messages Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <List>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  flexDirection: 'column',
                  alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    maxWidth: '70%',
                    gap: 1
                  }}
                >
                  {message.type === 'bot' && (
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <BotIcon />
                    </Avatar>
                  )}
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: message.type === 'user' ? 'primary.main' : 'grey.100',
                      color: message.type === 'user' ? 'white' : 'text.primary',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                  </Paper>
                  {message.type === 'user' && (
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                      <PersonIcon />
                    </Avatar>
                  )}
                </Box>
              </ListItem>
            ))}
            
            {isTyping && (
              <ListItem sx={{ justifyContent: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <BotIcon />
                  </Avatar>
                  <CircularProgress size={20} />
                </Box>
              </ListItem>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        {/* Property Suggestions for Buyers */}
        {conversationState === 'suggestions' && suggestedProperties.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>Suggested Properties</Typography>
            <Grid container spacing={2}>
              {suggestedProperties.map((property) => (
                <Grid item xs={12} sm={6} md={4} key={property.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{property.address}</Typography>
                      <Typography variant="h5" color="primary" gutterBottom>
                        {property.price}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {property.bedrooms} bed • {property.bathrooms} bath • {property.sqft} sqft
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {property.features && property.features.map((feature, index) => (
                          <Chip
                            key={index}
                            label={feature}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => handleViewListing(property.id)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ConversationalSearch;