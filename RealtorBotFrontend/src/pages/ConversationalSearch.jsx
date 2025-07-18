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
import { createAssistantSession, sendAssistantMessage, deleteAssistantSession } from '../services/assistantAPI';

const ConversationalSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
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

  // Initialize conversation with Watsonx Assistant
  useEffect(() => {
    const initializeAssistant = async () => {
      try {
        console.log('Initializing Watsonx Assistant session...');
        
        // Create a new assistant session
        const sessionResult = await createAssistantSession();
        setSessionId(sessionResult.sessionId);
        
        // Send initial message based on user role
        let initialMessage = '';
        if (isBuyer) {
          initialMessage = "Hello! I'm a buyer looking for properties. Can you help me find my perfect home?";
        } else if (isSeller) {
          initialMessage = "Hello! I'm a seller looking to create a property listing. Can you help me with that?";
        } else {
          initialMessage = "Hello! I'm here to help with real estate. What can I assist you with today?";
        }
        
        // Send initial message to assistant
        const response = await sendAssistantMessage(initialMessage, sessionResult.sessionId);
        
        // Add assistant's response to messages
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: response.response,
          timestamp: new Date()
        };
        
        setMessages([botMessage]);
        
        // Handle any actions from the assistant
        if (response.actions && response.actions.length > 0) {
          handleAssistantActions(response.actions);
        }
        
      } catch (error) {
        console.error('Error initializing assistant:', error);
        setError('Failed to initialize AI assistant. Please try again.');
        
        // Fallback to basic welcome message
        setMessages([
          {
            id: 1,
            type: 'bot',
            content: `Hello! I'm your AI real estate assistant. How can I help you today?`,
            timestamp: new Date()
          }
        ]);
      }
    };
    
    if (user) {
      initializeAssistant();
    }
    
    // Cleanup function to delete session when component unmounts
    return () => {
      if (sessionId) {
        deleteAssistantSession(sessionId).catch(console.error);
      }
    };
  }, [user, isBuyer, isSeller]);

  // Handle assistant actions (like search results or listing creation)
  const handleAssistantActions = (actions) => {
    actions.forEach(action => {
      if (action.action === 'search_properties' && action.result.success) {
        setSuggestedProperties(action.result.properties || []);
      } else if (action.action === 'create_listing' && action.result.success) {
        // Show success message for listing creation
        const successMessage = {
          id: Date.now(),
          type: 'bot',
          content: `Great! I've successfully created your listing: ${action.result.property.title} at ${action.result.property.address} for ${action.result.property.price}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      }
    });
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

    // Send message to Watsonx Assistant
    setTimeout(async () => {
      try {
        console.log('Sending message to Watsonx Assistant:', inputMessage);
        const response = await sendAssistantMessage(inputMessage, sessionId);
        
        // Add assistant's response to messages
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: response.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // Handle any actions from the assistant
        if (response.actions && response.actions.length > 0) {
          handleAssistantActions(response.actions);
        }
        
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
        {suggestedProperties.length > 0 && (
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