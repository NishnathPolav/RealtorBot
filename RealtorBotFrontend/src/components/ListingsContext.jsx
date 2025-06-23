import React, { createContext, useContext, useState } from 'react';

const ListingsContext = createContext();

export const useListings = () => useContext(ListingsContext);

const initialListings = [
  { id: 1, title: '123 Main St', status: 'Active', address: '123 Main St', price: 500000, description: 'A lovely home.' },
  { id: 2, title: '456 Oak Ave', status: 'Inactive', address: '456 Oak Ave', price: 420000, description: 'Spacious and bright.' },
];

export const ListingsProvider = ({ children }) => {
  const [listings, setListings] = useState(initialListings);

  const addListing = (listing) => {
    setListings((prev) => [
      { ...listing, id: Date.now(), status: 'Active' },
      ...prev,
    ]);
  };

  const editListing = (id, updated) => {
    setListings((prev) => prev.map(l => l.id === id ? { ...l, ...updated } : l));
  };

  const deleteListing = (id) => {
    setListings((prev) => prev.filter(l => l.id !== id));
  };

  return (
    <ListingsContext.Provider value={{ listings, addListing, editListing, deleteListing }}>
      {children}
    </ListingsContext.Provider>
  );
}; 