const API_BASE_URL = 'http://localhost:5001/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to set auth token
const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

// Helper function to remove auth token
const removeAuthToken = () => {
  localStorage.removeItem('token');
};

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  register: async (email, password, role) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    setAuthToken(response.token);
    return response;
  },

  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(response.token);
    return response;
  },

  googleLogin: async (googleToken) => {
    const response = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ googleToken }),
    });
    setAuthToken(response.token);
    return response;
  },

  verifyToken: async () => {
    return await apiRequest('/auth/verify');
  },

  logout: () => {
    removeAuthToken();
  },
};

// Properties API
export const propertiesAPI = {
  getAll: async (search = '', filters = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filters.price_min) params.append('price_min', filters.price_min);
    if (filters.price_max) params.append('price_max', filters.price_max);
    if (filters.status) params.append('status', filters.status);
    
    // Add timestamp to prevent caching
    params.append('t', Date.now());
    
    return await apiRequest(`/properties?${params.toString()}`);
  },

  getById: async (id) => {
    return await apiRequest(`/properties/${id}`);
  },

  create: async (propertyData) => {
    return await apiRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  update: async (id, updates) => {
    return await apiRequest(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/properties/${id}`, {
      method: 'DELETE',
    });
  },

  getMyProperties: async () => {
    console.log('API: getMyProperties called');
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await apiRequest(`/properties/seller/my-properties?t=${timestamp}`);
      console.log('API: getMyProperties response:', response);
      return response;
    } catch (error) {
      console.error('API: getMyProperties failed:', error);
      throw error;
    }
  },
};

// Tours API
export const toursAPI = {
  getMyTours: async () => {
    console.log('API: getMyTours called');
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await apiRequest(`/tours/buyer/my-tours?t=${timestamp}`);
      console.log('API: getMyTours response:', response);
      return response;
    } catch (error) {
      console.error('API: getMyTours failed:', error);
      throw error;
    }
  },

  getSellerTours: async () => {
    console.log('API: getSellerTours called');
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await apiRequest(`/tours/seller/my-tours?t=${timestamp}`);
      console.log('API: getSellerTours response:', response);
      return response;
    } catch (error) {
      console.error('API: getSellerTours failed:', error);
      throw error;
    }
  },

  getById: async (id) => {
    return await apiRequest(`/tours/${id}`);
  },

  create: async (tourData) => {
    return await apiRequest('/tours', {
      method: 'POST',
      body: JSON.stringify(tourData),
    });
  },

  update: async (id, updates) => {
    return await apiRequest(`/tours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/tours/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    return await apiRequest('/users/profile');
  },

  updateProfile: async (updates) => {
    return await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  getPreferences: async () => {
    return await apiRequest('/users/preferences');
  },

  updatePreferences: async (preferences) => {
    return await apiRequest('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
  },

  getSuggestions: async () => {
    return await apiRequest('/users/suggestions');
  },

  changeRole: async (role) => {
    const response = await apiRequest('/users/role', {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    setAuthToken(response.token);
    return response;
  },
};

export { getAuthToken, setAuthToken, removeAuthToken }; 