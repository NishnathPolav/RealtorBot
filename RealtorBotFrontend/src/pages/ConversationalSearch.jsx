import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
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
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  const isBuyer = user?.role === 'buyer';
  const isSeller = user?.role === 'seller';

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
        setIsInitialized(true);
        
        console.log('Assistant session created successfully:', sessionResult.sessionId);
        
      } catch (error) {
        console.error('Error initializing assistant:', error);
        setError('Failed to initialize AI assistant. Please try again.');
      }
    };
    
    if (user && !isInitialized) {
      initializeAssistant();
    }
    
    // Cleanup function to delete session when component unmounts
    return () => {
      if (sessionId) {
        deleteAssistantSession(sessionId).catch(console.error);
      }
    };
  }, [user, isInitialized]);

  // Handle assistant actions (like search results)
  const handleAssistantActions = (actions) => {
    console.log('Handling assistant actions:', actions);
    
    actions.forEach(action => {
      if (action.action === 'search_properties' && action.result.success) {
        setSuggestedProperties(action.result.properties || []);
      }
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      console.log('Sending message to Watsonx Assistant:', currentInput);
      const response = await sendAssistantMessage(currentInput, sessionId);
      
      console.log('Assistant response:', response);
      
      // Extract the response text from the assistant
      let responseText = '';
      
      if (response.response && response.response.output && response.response.output.generic) {
        const genericResponse = response.response.output.generic.find(item => item.response_type === 'text');
        if (genericResponse) {
          responseText = genericResponse.text;
        }
      }
      
      // Only add assistant response if there's actual content
      if (responseText) {
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: responseText,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
      
      // Handle any actions from the assistant
      if (response.actions && response.actions.length > 0) {
        handleAssistantActions(response.actions);
      }
      
    } catch (error) {
      console.error('Error processing user response:', error);
      setError(error.message);
    } finally {
      setIsTyping(false);
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

  // If user is not authenticated, show login/signup options
  if (!user) {
    return (
      <Box display="flex" flexDirection="column" sx={{ height: '70vh' }}>
        <Typography variant="h4" gutterBottom>AI Property Assistant</Typography>
        <Paper sx={{ flex: 1, p: 2, mb: 2, overflowY: 'auto' }}>
          <Typography variant="body2" color="text.secondary">
            Please sign up or log in to start chatting with our AI assistant.
          </Typography>
        </Paper>
        <Box textAlign="center" mt={2}>
          <Typography variant="body1" gutterBottom>
            Please Sign Up or Log In to get Started
          </Typography>
          <Box display="flex" justifyContent="center" gap={2}>
            <Button variant="contained" color="primary" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
            <Button variant="outlined" color="primary" onClick={() => navigate('/login')}>
              Log In
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

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
              disabled={isTyping || !sessionId}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || !sessionId}
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