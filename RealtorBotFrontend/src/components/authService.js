// Mock auth service for frontend development
export const login = (email, password) => {
  // Accept any credentials
  return Promise.resolve({ email, role: 'buyer' });
};

export const signup = (email, password, role) => {
  // Accept any signup
  return Promise.resolve({ email, role });
};

export const logout = () => {
  return Promise.resolve();
}; 