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

// Create a new assistant session
export const createAssistantSession = async () => {
  try {
    console.log('Creating assistant session...');
    
    const response = await makeAuthenticatedRequest('/assistant/session', {
      method: 'POST',
    });

    console.log('Assistant session created:', response);
    return response;
  } catch (error) {
    console.error('Error creating assistant session:', error);
    throw error;
  }
};

// Send a message to the assistant
export const sendAssistantMessage = async (message, sessionId) => {
  try {
    console.log('Sending assistant message:', { message, sessionId });
    
    const response = await makeAuthenticatedRequest('/assistant/message', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });

    console.log('Assistant response:', response);
    return response;
  } catch (error) {
    console.error('Error sending assistant message:', error);
    throw error;
  }
};

// Delete an assistant session
export const deleteAssistantSession = async (sessionId) => {
  try {
    console.log('Deleting assistant session:', sessionId);
    
    const response = await makeAuthenticatedRequest(`/assistant/session/${sessionId}`, {
      method: 'DELETE',
    });

    console.log('Assistant session deleted:', response);
    return response;
  } catch (error) {
    console.error('Error deleting assistant session:', error);
    throw error;
  }
}; 