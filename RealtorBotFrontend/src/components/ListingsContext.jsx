import React, { createContext, useContext, useState, useEffect } from 'react';
import { propertiesAPI } from '../services/api';
import { useAuth } from './AuthContext';

const ListingsContext = createContext();

export const useListings = () => useContext(ListingsContext);

export const ListingsProvider = ({ children }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Load listings on mount and when user changes
  useEffect(() => {
    console.log('ListingsContext: User changed:', user);
    if (user) {
      console.log('ListingsContext: Loading listings for user:', user.email, user.role);
      loadListings();
    } else {
      console.log('ListingsContext: Clearing listings (user logged out)');
      setListings([]); // Clear listings on logout
    }
  }, [user]);

  const loadListings = async () => {
    console.log('ListingsContext: loadListings called');
    setLoading(true);
    setError(null);
    try {
      let response;
      
      // If user is a seller, load only their properties
      if (user && user.role === 'seller') {
        console.log('ListingsContext: Loading seller properties');
        response = await propertiesAPI.getMyProperties();
        console.log('ListingsContext: Seller properties response:', response);
        setListings(response.properties || []);
      } else {
        console.log('ListingsContext: Loading all properties');
        response = await propertiesAPI.getAll();
        console.log('ListingsContext: All properties response:', response);
        setListings(response.properties || []);
      }
    } catch (error) {
      console.error('Failed to load listings:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addListing = async (listingData) => {
    try {
      const response = await propertiesAPI.create(listingData);
      // For sellers, add to their listings. For others, refresh all listings
      if (user && user.role === 'seller') {
        setListings(prev => [response.property, ...prev]);
      } else {
        await loadListings(); // Refresh all listings
      }
      return response.property;
    } catch (error) {
      console.error('Failed to add listing:', error);
      throw error;
    }
  };

  const editListing = async (id, updates) => {
    try {
      const response = await propertiesAPI.update(id, updates);
      setListings(prev => prev.map(listing => 
        listing.id === id ? { ...listing, ...response.property } : listing
      ));
      return response.property;
    } catch (error) {
      console.error('Failed to edit listing:', error);
      throw error;
    }
  };

  const deleteListing = async (id) => {
    try {
      await propertiesAPI.delete(id);
      setListings(prev => prev.filter(listing => listing.id !== id));
    } catch (error) {
      console.error('Failed to delete listing:', error);
      throw error;
    }
  };

  const getListing = async (id) => {
    try {
      const response = await propertiesAPI.getById(id);
      return response;
    } catch (error) {
      console.error('Failed to get listing:', error);
      throw error;
    }
  };

  const searchListings = async (search, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      // If user is a seller, search within their properties
      if (user && user.role === 'seller') {
        // For sellers, we'll search within their own properties
        const myProperties = await propertiesAPI.getMyProperties();
        const filteredProperties = myProperties.properties.filter(property => {
          const searchLower = search.toLowerCase();
          return property.title.toLowerCase().includes(searchLower) ||
                 property.address.toLowerCase().includes(searchLower) ||
                 property.description.toLowerCase().includes(searchLower);
        });
        response = { properties: filteredProperties };
      } else {
        // For buyers, search all properties
        response = await propertiesAPI.getAll(search, filters);
      }
      
      setListings(response.properties || []);
      return response;
    } catch (error) {
      console.error('Failed to search listings:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    listings,
    loading,
    error,
    addListing,
    editListing,
    deleteListing,
    getListing,
    searchListings,
    loadListings
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
}; 