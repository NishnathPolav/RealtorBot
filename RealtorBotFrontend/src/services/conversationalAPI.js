import { getAuthToken } from './api';

const API_BASE_URL = 'http://localhost:5001/api';

// Helper function to make authenticated API calls
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Get property recommendations based on buyer preferences
export const getPropertyRecommendations = async (preferences) => {
  try {
    console.log('Getting property recommendations with preferences:', preferences);
    
    const response = await makeAuthenticatedRequest('/conversational/recommendations', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });

    console.log('Property recommendations response:', response);
    return response;
  } catch (error) {
    console.error('Error getting property recommendations:', error);
    throw error;
  }
};

// Create property listing from conversational input (for sellers)
export const createListingFromConversation = async (propertyDetails) => {
  try {
    console.log('Creating listing from conversation with details:', propertyDetails);
    
    const response = await makeAuthenticatedRequest('/conversational/create-listing', {
      method: 'POST',
      body: JSON.stringify(propertyDetails),
    });

    console.log('Create listing response:', response);
    return response;
  } catch (error) {
    console.error('Error creating listing from conversation:', error);
    throw error;
  }
};

// Get conversation history (for future enhancement)
export const getConversationHistory = async () => {
  try {
    const response = await makeAuthenticatedRequest('/conversational/history', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    console.error('Error getting conversation history:', error);
    throw error;
  }
};

// Enhanced property search with filters
export const searchProperties = async (searchParams) => {
  try {
    const queryString = new URLSearchParams(searchParams).toString();
    const response = await makeAuthenticatedRequest(`/properties?${queryString}`);
    return response;
  } catch (error) {
    console.error('Error searching properties:', error);
    throw error;
  }
};

// Get property by ID
export const getPropertyById = async (propertyId) => {
  try {
    const response = await makeAuthenticatedRequest(`/properties/${propertyId}`);
    return response;
  } catch (error) {
    console.error('Error getting property by ID:', error);
    throw error;
  }
}; 