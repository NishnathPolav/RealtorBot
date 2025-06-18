import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Footer = () => (
  <Box component="footer" sx={{ p: 2, textAlign: 'center', bgcolor: 'background.paper' }}>
    <Typography variant="body2" color="text.secondary">
      &copy; {new Date().getFullYear()} RealtorBot AI Broker. All rights reserved.
    </Typography>
  </Box>
);

export default Footer;