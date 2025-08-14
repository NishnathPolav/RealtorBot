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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, SmartToy as BotIcon } from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';
import { useListings } from '../components/ListingsContext';
import { useNavigate } from 'react-router-dom';
import { createAssistantSession, sendAssistantMessage, deleteAssistantSession } from '../services/assistantAPI';
import { propertiesAPI } from '../services/api';
import { getAuthToken } from '../services/api';

// Test function to manually trigger property search
const testPropertySearch = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5001/api/assistant/test-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: '3 bedroom house in Dallas',
        filters: {
          price_max: 500000,
          bedrooms_min: 3,
          location: 'Dallas'
        }
      })
    });
    
    const data = await response.json();
    console.log('Test search response:', data);
    
    if (data.success && data.searchResult.success) {
      setSuggestedProperties(data.searchResult.properties || []);
      console.log('Test search successful, properties:', data.searchResult.properties);
    } else {
      console.error('Test search failed:', data);
    }
  } catch (error) {
    console.error('Test search error:', error);
  }
};

const Chat = ({ onClose }) => {
  const { user } = useAuth();
  const { addListing } = useListings();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestedProperties, setSuggestedProperties] = useState([]);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [baseMessageAdded, setBaseMessageAdded] = useState(false);
  const [pendingSessionVariables, setPendingSessionVariables] = useState(null);
  const [searchParameters, setSearchParameters] = useState(null);
  const [showDashboardPrompt, setShowDashboardPrompt] = useState(false);
  
  // Property listing creation state
  const [propertyInfo, setPropertyInfo] = useState({
    title: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    price: '',
    description: ''
  });
  const [showListingConfirmation, setShowListingConfirmation] = useState(false);
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [listingCreationResult, setListingCreationResult] = useState(null);
  
  // Track conversation state for property listing creation
  const [conversationState, setConversationState] = useState({
    isListingConversation: false,
    currentStep: 0,
    variables: {
      propertyType: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      price: '',
      bedrooms: '',
      bathrooms: '',
      squareFootage: '',
      description: ''
    }
  });

  // Define the expected assistant prompts in order
  const listingPrompts = [
    "I'll help you create a listing for your property",
    "What's the street address of the property?",
    "What city is the property in?",
    "What state is the property in (e.g., NY, CA)?",
    "What's the ZIP code?",
    "What's your asking price?",
    "How many bedrooms?",
    "How many bathrooms?",
    "What's the square footage?",
    "Describe your property (features, condition, etc.)",
    "Should I proceed to create the listing"
  ];

  // Check if a message contains a listing prompt
  const isListingPrompt = (message) => {
    return listingPrompts.some(prompt => 
      message.toLowerCase().includes(prompt.toLowerCase())
    );
  };

  // Check if this is a property listing conversation
  const isPropertyListingConversation = (messages) => {
    const recentMessages = messages.slice(-5);
    const conversationText = recentMessages.map(m => m.content.toLowerCase()).join(' ');
    
    const listingKeywords = [
      'create listing', 'list my property', 'add property', 'sell my house',
      'list house', 'list apartment', 'property listing', 'create property',
      'add listing', 'sell property', 'list my house'
    ];
    
    return listingKeywords.some(keyword => conversationText.includes(keyword));
  };

  // Parse a textual summary like:
  // "Searching for properties with budget: 500000; location: Irving; bathrooms: 5; bedrooms: 4; type: House"
  // and return dashboard filters
  const parseDashboardFiltersFromSummary = (text) => {
    if (!text || typeof text !== 'string') return null;
    // Do not require a specific prefix; try to parse key:value pairs

    const pairs = {};
    // Support synonyms/variants and separators (semicolon, comma)
    const regex = /(budget range|budget|price|max budget|location|city|bathrooms|bathroom|bedrooms|bedroom|type|property type)\s*:\s*([^;,\n]+)/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const key = match[1].toLowerCase().trim();
      const value = match[2].trim();
      pairs[key] = value;
    }

    const foundKeys = Object.keys(pairs);
    if (foundKeys.length === 0) return null;

    const rawBudget = pairs['budget range'] || pairs.budget || pairs.price || pairs['max budget'] || '';
    const budgetNum = rawBudget ? rawBudget.toString().replace(/[^\d]/g, '') : '';
    const bedroomsRaw = pairs.bedrooms || pairs.bedroom || '';
    const bathroomsRaw = pairs.bathrooms || pairs.bathroom || '';
    const bedroomsNum = bedroomsRaw ? bedroomsRaw.toString().replace(/[^\d]/g, '') : '';
    const bathroomsNum = bathroomsRaw ? bathroomsRaw.toString().replace(/[^\d]/g, '') : '';
    const propertyType = pairs.type || pairs['property type'] || '';
    const location = pairs.location || pairs.city || '';

    const filters = {
      location,
      priceMin: '',
      priceMax: budgetNum || '',
      bedrooms: bedroomsNum || '',
      bathrooms: bathroomsNum || '',
      propertyType
    };
    // Require at least 2 meaningful criteria to reduce false positives
    const criteriaCount = [filters.location, filters.priceMax, filters.bedrooms, filters.bathrooms, filters.propertyType]
      .filter(v => v && v.toString().trim() !== '').length;
    if (criteriaCount >= 2) {
      return filters;
    }
    return null;
  };

  // Extract property information based on conversation flow
  const extractPropertyInfoFromConversation = (messages) => {
    const variables = {
      propertyType: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      price: '',
      bedrooms: '',
      bathrooms: '',
      squareFootage: '',
      description: ''
    };

    let currentStep = 0;
    let lastBotMessage = '';

    // Process messages in order to track the conversation flow
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      if (message.type === 'bot') {
        lastBotMessage = message.content;
        
        // Check if this is a listing prompt and update current step
        if (isListingPrompt(message.content)) {
          for (let j = 0; j < listingPrompts.length; j++) {
            if (message.content.toLowerCase().includes(listingPrompts[j].toLowerCase())) {
              currentStep = j;
              break;
            }
          }
        }
      } else if (message.type === 'user') {
        // Skip trigger phrases
        const triggerPhrases = ['create listing', 'list my property', 'add property', 'sell my house'];
        const isTrigger = triggerPhrases.some(phrase => 
          message.content.toLowerCase().includes(phrase.toLowerCase())
        );
        
        if (!isTrigger) {
          // Skip confirmation responses (Yes/No) - they shouldn't be stored as property data
          const isConfirmation = message.content.toLowerCase().trim() === 'yes' || message.content.toLowerCase().trim() === 'no';
          
          if (!isConfirmation) {
            // Assign user response to the appropriate variable based on current step
            switch (currentStep) {
              case 0: // "I'll help you create a listing for your property"
                variables.propertyType = message.content.trim();
                break;
              case 1: // "What's the street address of the property?"
                variables.street = message.content.trim();
                break;
              case 2: // "What city is the property in?"
                variables.city = message.content.trim();
                break;
              case 3: // "What state is the property in (e.g., NY, CA)?"
                variables.state = message.content.trim();
                break;
              case 4: // "What's the ZIP code?"
                variables.zip = message.content.trim();
                break;
              case 5: // "What's your asking price?"
                variables.price = message.content.trim();
                break;
              case 6: // "How many bedrooms?"
                variables.bedrooms = message.content.trim();
                break;
              case 7: // "How many bathrooms?"
                variables.bathrooms = message.content.trim();
                break;
              case 8: // "What's the square footage?"
                variables.squareFootage = message.content.trim();
                break;
              case 9: // "Describe your property (features, condition, etc.)"
                variables.description = message.content.trim();
                break;
              case 10: // "Should I proceed to create the listing" - confirmation step
                // Don't store confirmation responses as property data
                break;
            }
          }
        }
      }
    }

    // Check if we have all required fields
    const requiredFields = ['propertyType', 'street', 'city', 'state', 'zip', 'price'];
    const hasAllRequired = requiredFields.every(field => variables[field] && variables[field].trim());
    
    // Create property info object
    const propertyInfo = {
      title: variables.propertyType || '',
      street: variables.street,
      city: variables.city,
      state: variables.state,
      zip: variables.zip,
      price: variables.price,
      description: variables.description,
      bedrooms: variables.bedrooms,
      bathrooms: variables.bathrooms,
      squareFootage: variables.squareFootage
    };

    console.log('Extracted variables from conversation:', variables);
    console.log('Property info:', propertyInfo);
    console.log('Has all required fields:', hasAllRequired);

    return hasAllRequired ? propertyInfo : null;
  };

  const messagesEndRef = useRef(null);

  const isBuyer = user?.role === 'buyer';
  const isSeller = user?.role === 'seller';

  console.log('Chat component loaded');
  console.log('User:', user);
  console.log('isBuyer:', isBuyer, 'isSeller:', isSeller);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize base message immediately when component mounts
  useEffect(() => {
    console.log('Chat component mounted, setting initial base message');
    const baseMessage = {
      id: 'base-message',
      type: 'bot',
      content: 'Hello! I am your AI Assistant, how can I help?',
      timestamp: new Date()
    };
    setMessages([baseMessage]);
    setBaseMessageAdded(true);
    console.log('Initial base message set in Chat component:', baseMessage);
  }, []);

  // Safeguard: Ensure base message is always present
  useEffect(() => {
    const hasBaseMessage = messages.some(msg => msg.id === 'base-message');
    if (!hasBaseMessage && messages.length > 0) {
      console.log('Base message missing in Chat component, restoring it');
      const baseMessage = {
        id: 'base-message',
        type: 'bot',
        content: 'Hello! I am your AI Assistant, how can I help?',
        timestamp: new Date()
      };
      setMessages(prev => [baseMessage, ...prev]);
    }
  }, [messages]);

  // Initialize conversation with Watsonx Assistant (only create session, no preset messages)
  useEffect(() => {
    const initializeAssistant = async () => {
      try {
        console.log('Initializing Watsonx Assistant session...');
        console.log('Current user:', user);
        
        // Create a new assistant session
        const sessionResult = await createAssistantSession();
        console.log('Session creation result:', sessionResult);
        
        setSessionId(sessionResult.sessionId);
        setIsInitialized(true);
        
        console.log('Assistant session created successfully:', sessionResult.sessionId);
        
        // Don't add any preset messages - let the user start the conversation
        
      } catch (error) {
        console.error('Error initializing assistant:', error);
        setError('Failed to initialize AI assistant. Please try again.');
        
        // Add error message to chat for debugging
        const errorMessage = {
          id: Date.now(),
          type: 'bot',
          content: `Failed to initialize assistant: ${error.message}`,
          timestamp: new Date()
        };
        setMessages([errorMessage]);
      }
    };
    
    if (user && !isInitialized && !sessionId) {
      console.log('Starting assistant initialization for user:', user);
      initializeAssistant();
    } else {
      console.log('Skipping initialization - user:', user, 'isInitialized:', isInitialized, 'sessionId:', sessionId);
    }
    
    // Cleanup function to delete session when component unmounts
    return () => {
      if (sessionId) {
        deleteAssistantSession(sessionId).catch(console.error);
      }
    };
  }, [user, isBuyer, isSeller]);

  // Extract property information from assistant context
  const extractPropertyInfo = (context) => {
    if (!context || !context.variables) return null;
    
    const variables = context.variables;
    const extracted = {
      title: variables.propertyType ? `${variables.propertyType} at ${variables.street || ''}` : '',
      street: variables.street || '',
      city: variables.city || '',
      state: variables.state || '',
      zip: variables.zip || '',
      price: variables.price || '',
      description: variables.description || ''
    };
    
    // Check if we have all required fields
    const requiredFields = ['street', 'city', 'state', 'zip', 'price'];
    const hasAllRequired = requiredFields.every(field => extracted[field] && extracted[field].trim());
    
    return hasAllRequired ? extracted : null;
  };

  // Check if the conversation indicates property listing creation
  const checkListingReadiness = (messages) => {
    // Only check for sellers
    if (!isSeller) return null;
    
    // Check if this is a property listing conversation
    if (!isPropertyListingConversation(messages)) return null;
    
    // Extract property information from messages
    const extractedInfo = extractPropertyInfoFromConversation(messages);
    
    if (extractedInfo) {
      console.log('Extracted property info from conversation:', extractedInfo);
      return extractedInfo;
    }
    
    return null;
  };

  // Handle assistant actions (like search results or listing creation)
  const handleAssistantActions = (actions) => {
    console.log('Handling assistant actions:', actions);
    
    actions.forEach(action => {
      if (action.action === 'search_properties' && action.result.success) {
        console.log('Setting suggested properties from action:', action.result.properties);
        setSuggestedProperties(action.result.properties || []);
        
        // Add a message showing search results
        if (action.result.properties && action.result.properties.length > 0) {
          const searchMessage = {
            id: Date.now(),
            type: 'bot',
            content: `I found ${action.result.properties.length} properties matching your criteria. Here are the results:`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, searchMessage]);
        } else {
          const noResultsMessage = {
            id: Date.now(),
            type: 'bot',
            content: `I couldn't find any properties matching your criteria. Try adjusting your search parameters.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, noResultsMessage]);
        }
      } else if (action.action === 'create_listing' && action.result.success) {
        // Clear any suggested properties since this is for sellers
        setSuggestedProperties([]);
        
        // Show success message
        const successMessage = {
          id: Date.now(),
          type: 'bot',
          content: `Great! Your property listing has been created successfully. You can view it in your seller dashboard.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
        
        // Reset property info
        setPropertyInfo({
          title: '',
          street: '',
          city: '',
          state: '',
          zip: '',
          price: '',
          description: ''
        });
      }
    });
  };

  const handleSendMessage = async () => {
    console.log('=== handleSendMessage START ===');
    console.log('inputMessage:', inputMessage);
    console.log('sessionId:', sessionId);
    console.log('user:', user);
    
    if (!inputMessage.trim() || !sessionId) {
      console.log('Early return - missing input or sessionId');
      return;
    }

    console.log('handleSendMessage called with:', inputMessage);
    console.log('Current sessionId:', sessionId);
    console.log('Current user:', user);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    console.log('Adding user message to chat:', userMessage);
    setMessages(prev => {
      console.log('Current messages before adding user message:', prev);
      const newMessages = [...prev, userMessage];
      console.log('Messages after adding user message:', newMessages);
      return newMessages;
    });
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      console.log('Sending message to Watsonx Assistant:', currentInput);
      const response = await sendAssistantMessage(currentInput, sessionId);
      
      console.log('Assistant response received:', response);
      console.log('Response structure:', {
        hasResponse: !!response.response,
        hasOutput: !!(response.response && response.response.output),
        hasGeneric: !!(response.response && response.response.output && response.response.output.generic),
        genericCount: response.response?.output?.generic?.length || 0,
        directResponse: typeof response.response === 'string'
      });
      
      // Extract the response text from the assistant
      let responseText = '';
      
      // Check if response is a direct string (backend format)
      if (typeof response.response === 'string') {
        responseText = response.response;
        console.log('Found direct string response:', responseText);
      }
      // Check if response has the Watson Assistant structure
      else if (response.response && response.response.output && response.response.output.generic) {
        console.log('Processing generic responses:', response.response.output.generic);
        const genericResponse = response.response.output.generic.find(item => item.response_type === 'text');
        if (genericResponse) {
          responseText = genericResponse.text;
          console.log('Found text response:', responseText);
        } else {
          console.log('No text response found in generic responses');
        }
      } else {
        console.log('No generic responses found in response structure');
      }
      
      // Only add assistant response if there's actual content
      let botMessage = null;
      // Always intercept "searching for properties" messages and redirect
      if (responseText && responseText.toLowerCase().includes('searching for properties')) {
        const dashboardFilters = parseDashboardFiltersFromSummary(responseText) || {};
        setSearchParameters(dashboardFilters);
        setShowDashboardPrompt(true);
        return;
      }
      // --- Intercept summary confirmation message ---
      if (responseText && responseText.startsWith('Thank you for providing this information')) {
        // Remove the greeting and any leading blank lines before parsing fields
        const propertyBlock = responseText.replace(/^Thank you for providing this information\.?[\s\S]*?/i, '').trimStart();
        // Clean bold markers and carriage returns
        const cleanBlock = propertyBlock.replace(/\*\*/g, '').replace(/\r/g, '');
        // Split into non-empty lines
        const lines = cleanBlock.split(/\n+/).map(l => l.trim()).filter(l => l && !/^Should I proceed/i.test(l));
        const fieldMap = {};
        lines.forEach(line => {
          const parts = line.split(/:\s*/, 2);
          if (parts.length === 2) {
            const label = parts[0].toLowerCase();
            const value = parts[1].trim();
            fieldMap[label] = value;
          }
        });
        const extractedVars = {
          propertyType: fieldMap['property type'] || '',
          street: fieldMap['street'] || '',
          city: fieldMap['city'] || '',
          state: fieldMap['state'] || '',
          zip: fieldMap['zip'] || '',
          price: fieldMap['price'] || '',
          bedrooms: fieldMap['bedrooms'] || '',
          bathrooms: fieldMap['bathrooms'] || '',
          squareFootage: fieldMap['square footage'] || fieldMap['square footage'] || '',
          description: fieldMap['description'] || '',
        };
        const hasSome = Object.values(extractedVars).some(v => v);
        if (hasSome) {
          extractedVars.title = extractedVars.propertyType ? `${extractedVars.propertyType} at ${extractedVars.street || ''}` : '';
          setPropertyInfo(extractedVars);
          setPendingSessionVariables(extractedVars);
        } else {
          // Fallback
          setPropertyInfo({
            title: '', street: '', city: '', state: '', zip: '', price: '', bedrooms: '', bathrooms: '', squareFootage: '', description: cleanBlock
          });
          setPendingSessionVariables(null);
        }
        setShowListingConfirmation(true);
        // Do NOT add the summary message to the chat
      } else if (responseText) {
        // Intercept and auto-redirect if the assistant printed a search summary line
        const dashboardFilters = parseDashboardFiltersFromSummary(responseText);
        if (dashboardFilters) {
          setSearchParameters(dashboardFilters);
          // Navigate immediately without adding the summary message to chat
          const queryParams = new URLSearchParams();
          Object.entries(dashboardFilters).forEach(([key, value]) => {
            if (value && value.toString().trim() !== '') {
              queryParams.append(key, value);
            }
          });
          setShowDashboardPrompt(true);
          return; // Stop further handling of this response
        } else {
        botMessage = {
          id: Date.now(),
          type: 'bot',
          content: responseText,
          timestamp: new Date()
        };
        setMessages(prev => {
          const newMessages = [...prev, botMessage];
          return newMessages;
        });
        }
      } else {
        botMessage = {
          id: Date.now(),
          type: 'bot',
          content: 'No response text found in assistant response',
          timestamp: new Date()
        };
        setMessages(prev => {
          const newMessages = [...prev, botMessage];
          return newMessages;
        });
      }
      
      // If assistant provides actions, do not perform backend search; just prompt to redirect
      if (response.actions && response.actions.length > 0) {
        console.log('Assistant returned actions:', response.actions);
        // Extract variables to build dashboard filters and prompt redirect
        const searchParams = response.sessionVariables || {};
        const dashboardFilters = {
          location: searchParams.location || searchParams.searchQuery || '',
          priceMin: searchParams.budget ? searchParams.budget.toString().replace(/[^\d]/g, '') : '',
          priceMax: searchParams.budget ? searchParams.budget.toString().replace(/[^\d]/g, '') : '',
          bedrooms: searchParams.bedrooms || '',
          bathrooms: searchParams.bathrooms || '',
          propertyType: searchParams.propertyType || ''
        };
        setSearchParameters(dashboardFilters);
        setShowDashboardPrompt(true);
      }
      // If sessionVariables exist without actions, prompt to redirect
      else if (response.sessionVariables && Object.keys(response.sessionVariables).length > 0) {
        const v = response.sessionVariables;
        const dashboardFilters = {
          location: v.location || v.searchQuery || '',
          priceMin: v.budget ? v.budget.toString().replace(/[^\d]/g, '') : '',
          priceMax: v.budget ? v.budget.toString().replace(/[^\d]/g, '') : '',
          bedrooms: v.bedrooms || '',
          bathrooms: v.bathrooms || '',
          propertyType: v.propertyType || ''
        };
        const hasAny = Object.values(dashboardFilters).some(val => val && val.toString().trim() !== '');
        if (hasAny) {
          setSearchParameters(dashboardFilters);
          setShowDashboardPrompt(true);
          return;
        }
      }
      
      // Use sessionVariables from backend to populate propertyInfo and show confirmation if awaitingConfirmation
      if (response.awaitingConfirmation && response.sessionVariables && Object.keys(response.sessionVariables).length > 0) {
        setPropertyInfo({
          ...response.sessionVariables,
          title: response.sessionVariables.propertyType
            ? `${response.sessionVariables.propertyType} at ${response.sessionVariables.street || ''}`
            : '',
        });
        setPendingSessionVariables(response.sessionVariables);
        setShowListingConfirmation(true);
      }
      
    } catch (error) {
      console.error('Error processing user response:', error);
      setError(error.message);
      
      // Add error message to chat for debugging
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => {
        console.log('Current messages before adding error message:', prev);
        const newMessages = [...prev, errorMessage];
        console.log('Messages after adding error message:', newMessages);
        return newMessages;
      });
    } finally {
      setIsTyping(false);
      console.log('=== handleSendMessage END ===');
    }
  };

  // Handle listing creation confirmation
  const handleConfirmListing = async () => {
    setIsCreatingListing(true);
    setShowListingConfirmation(false);
    try {
      // Send session variables to backend to create the listing
      const token = getAuthToken();
      const res = await fetch('http://localhost:5001/api/assistant/create-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(pendingSessionVariables)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create listing');
      setListingCreationResult({
        success: true,
        message: data.message,
        property: data.property
      });
      // Optionally, refresh listings or dashboard here
    } catch (error) {
      setListingCreationResult({
        success: false,
        message: `Failed to create listing: ${error.message}`
      });
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: `Sorry, I couldn't create your listing. Please try again or use the manual form.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsCreatingListing(false);
      setPendingSessionVariables(null);
    }
  };

  const handleCancelListing = () => {
    setShowListingConfirmation(false);
    setPropertyInfo({
      title: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      price: '',
      description: ''
    });
  };

  const handleViewListing = (listingId) => {
    navigate(`/listing/${listingId}`);
  };

  const buildDashboardUrl = () => {
    const queryParams = new URLSearchParams();
    if (searchParameters) {
      Object.entries(searchParameters).forEach(([key, value]) => {
        if (value && value.toString().trim() !== '') {
          queryParams.append(key, value);
        }
      });
    }
    return `/buyer-dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  };

  const navigateToDashboardWithFilters = () => {
    const url = buildDashboardUrl();
    console.log('Navigating to dashboard:', url, 'with filters:', searchParameters);
    navigate(url, { replace: false });
    // Fallback in case navigation is blocked for any reason
    setTimeout(() => {
      if (window.location.pathname === '/chat') {
        console.log('Fallback navigation via window.location.assign to', url);
        window.location.assign(url);
      }
    }, 50);
  };

  const handleKeyPress = (e) => {
    console.log('Key pressed:', e.key);
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('Enter key pressed, calling handleSendMessage');
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendButtonClick = () => {
    console.log('Send button clicked, calling handleSendMessage');
    handleSendMessage();
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
      
      {/* Test button for buyers */}
      {user && user.role === 'buyer' && (
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={testPropertySearch}
            size="small"
          >
            Test Property Search
          </Button>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Prompt to view results in dashboard */}
      <Dialog open={!!showDashboardPrompt} onClose={() => setShowDashboardPrompt(false)} maxWidth="sm" fullWidth>
        <DialogTitle>View Results in Dashboard</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            I’ve applied your preferences. Would you like to open the Buyer Dashboard to see the listings?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDashboardPrompt(false)}>
            Stay Here
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowDashboardPrompt(false);
              if (onClose) {
                try { onClose(); } catch (_) {}
              }
              navigateToDashboardWithFilters();
            }}
          >
            Open Dashboard
          </Button>
        </DialogActions>
      </Dialog>

      {/* Property Listing Confirmation Dialog */}
      <Dialog 
        open={showListingConfirmation} 
        onClose={handleCancelListing}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Confirm Property Listing</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            I've collected the following information about your property. Please review and confirm:
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Property Type"
                  value={propertyInfo.title || ''}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price"
                  value={propertyInfo.price}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Street Address"
                  value={propertyInfo.street}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="City"
                  value={propertyInfo.city}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="State"
                  value={propertyInfo.state}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Zip Code"
                  value={propertyInfo.zip}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Bedrooms"
                  value={propertyInfo.bedrooms || 'Not specified'}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Bathrooms"
                  value={propertyInfo.bathrooms || 'Not specified'}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Square Footage"
                  value={propertyInfo.squareFootage || 'Not specified'}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={propertyInfo.description || 'No description provided'}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelListing} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmListing} 
            variant="contained" 
            color="primary"
            disabled={isCreatingListing}
          >
            {isCreatingListing ? <CircularProgress size={20} /> : 'Create Listing'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Listing Creation Result Alert */}
      {listingCreationResult && (
        <Alert 
          severity={listingCreationResult.success ? 'success' : 'error'} 
          sx={{ mb: 2 }}
          onClose={() => setListingCreationResult(null)}
        >
          {listingCreationResult.message}
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
                    {message.hasAction && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={navigateToDashboardWithFilters}
                        >
                          View in Dashboard
                        </Button>
                      </Box>
                    )}
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
              onClick={handleSendButtonClick}
              disabled={!inputMessage.trim() || isTyping || !sessionId}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              <SendIcon />
            </Button>
                    </Box>
          
          {/* Manual property extraction trigger for sellers */}
          {isSeller && messages.length > 2 && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  // Prefer sessionVariables if available
                  const lastSessionVars = messages
                    .map(m => m.sessionVariables)
                    .filter(Boolean)
                    .pop();
                  if (lastSessionVars && Object.keys(lastSessionVars).length > 0) {
                    setPropertyInfo({
                      ...lastSessionVars,
                      title: lastSessionVars.propertyType
                        ? `${lastSessionVars.propertyType} at ${lastSessionVars.street || ''}`
                        : '',
                    });
                    setShowListingConfirmation(true);
                  } else {
                    // Fallback to old extraction if no sessionVariables
                    const extractedInfo = checkListingReadiness(messages);
                    if (extractedInfo) {
                      setPropertyInfo(extractedInfo);
                      setShowListingConfirmation(true);
                    } else {
                      // Show what information is missing
                      const testInfo = extractPropertyInfoFromConversation(messages);
                      console.log('Current extracted info:', testInfo);
                      // Show more helpful message based on what's missing
                      const missingFields = [];
                      if (!testInfo?.street) missingFields.push('street address');
                      if (!testInfo?.city) missingFields.push('city');
                      if (!testInfo?.state) missingFields.push('state');
                      if (!testInfo?.zip) missingFields.push('zip code');
                      if (!testInfo?.price) missingFields.push('price');
                      if (missingFields.length > 0) {
                        alert(`Not enough information yet. Please provide: ${missingFields.join(', ')}.`);
                      } else {
                        alert('Please continue the conversation with the AI assistant to provide all required property information.');
                      }
                    }
                  }
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                Check if I can create a listing
              </Button>
            </Box>
          )}
          </Box>
      </Paper>
    </Box>
  );
};

export default Chat;