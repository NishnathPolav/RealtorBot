import React, { createContext, useContext, useState, useEffect } from 'react';
import { toursAPI } from '../services/api';
import { useAuth } from './AuthContext';

const ToursContext = createContext();

export const useTours = () => useContext(ToursContext);

export const ToursProvider = ({ children }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Load tours on mount and when user changes
  useEffect(() => {
    console.log('ToursContext: User changed:', user);
    if (user && user.role === 'buyer') {
      console.log('ToursContext: Loading tours for buyer:', user.email);
      loadTours();
    } else {
      console.log('ToursContext: Clearing tours (user logged out or not buyer)');
      setTours([]); // Clear tours on logout or if not buyer
    }
  }, [user]);

  const loadTours = async () => {
    console.log('ToursContext: loadTours called');
    setLoading(true);
    setError(null);
    try {
      const response = await toursAPI.getMyTours();
      console.log('ToursContext: Tours response:', response);
      setTours(response.tours || []);
    } catch (error) {
      console.error('Failed to load tours:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTour = async (tourData) => {
    try {
      const response = await toursAPI.create(tourData);
      setTours(prev => [response.tour, ...prev]);
      return response.tour;
    } catch (error) {
      console.error('Failed to add tour:', error);
      throw error;
    }
  };

  const editTour = async (id, updates) => {
    try {
      const response = await toursAPI.update(id, updates);
      setTours(prev => prev.map(tour => 
        tour.id === id ? { ...tour, ...response.tour } : tour
      ));
      return response.tour;
    } catch (error) {
      console.error('Failed to edit tour:', error);
      throw error;
    }
  };

  const deleteTour = async (id) => {
    try {
      await toursAPI.delete(id);
      setTours(prev => prev.filter(tour => tour.id !== id));
    } catch (error) {
      console.error('Failed to delete tour:', error);
      throw error;
    }
  };

  const getTour = async (id) => {
    try {
      const response = await toursAPI.getById(id);
      return response;
    } catch (error) {
      console.error('Failed to get tour:', error);
      throw error;
    }
  };

  const value = {
    tours,
    loading,
    error,
    addTour,
    editTour,
    deleteTour,
    getTour,
    loadTours
  };

  return (
    <ToursContext.Provider value={value}>
      {children}
    </ToursContext.Provider>
  );
}; 