import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Box from '@mui/material/Box';

const drawerWidth = 240;

const Layout = ({ children }) => (
  <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
    <Header />
    <Box sx={{ display: 'flex', flex: 1, gap: 3, background: '#f9fafb' }}>
      <Sidebar />
      <Box component="main" sx={{ flex: 1, p: 3, background: '#f9fafb', minHeight: '100vh', borderRadius: 2 }}>
        {children}
      </Box>
    </Box>
    <Footer />
  </Box>
);

export default Layout;