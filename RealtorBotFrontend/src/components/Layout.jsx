import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Box from '@mui/material/Box';
import { useAuth } from './AuthContext';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Header />
      <Box sx={{ display: 'flex', flex: 1, gap: 3, background: '#f9fafb' }}>
        {user && <Sidebar />}
        <Box 
          component="main" 
          sx={{ 
            flex: 1, 
            p: 3, 
            background: '#f9fafb', 
            minHeight: '100vh', 
            borderRadius: 2,
            ml: user ? 0 : 0 // No left margin when sidebar is hidden
          }}
        >
          {children}
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;