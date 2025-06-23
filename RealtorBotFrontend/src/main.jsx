import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.css';
import { AuthProvider } from './components/AuthContext';
import { ListingsProvider } from './components/ListingsContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ListingsProvider>
        <App />
      </ListingsProvider>
    </AuthProvider>
  </React.StrictMode>
);