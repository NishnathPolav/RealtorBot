import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getAuthToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getUserFromStorage = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUserFromStorage());
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const response = await authAPI.verifyToken();
          setUser(response.user);
        } catch (error) {
          console.error('Token verification failed:', error);
          authAPI.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Login attempt for:', email);
      const response = await authAPI.login(email, password);
      console.log('AuthContext: Login successful, setting user:', response.user);
      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      console.log('AuthContext: Google login attempt');
      const response = await authAPI.googleLogin(googleToken);
      console.log('AuthContext: Google login successful, setting user:', response.user);
      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error('AuthContext: Google login failed:', error);
      throw error;
    }
  };

  const signup = async (email, password, role) => {
    try {
      console.log('AuthContext: Signup attempt for:', email, role);
      const response = await authAPI.register(email, password, role);
      console.log('AuthContext: Signup successful, setting user:', response.user);
      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error('AuthContext: Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logout called, clearing user');
    authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    googleLogin,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 