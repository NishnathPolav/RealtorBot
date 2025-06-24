import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div>
      <Typography variant="h3" gutterBottom>Welcome to RealtorBot</Typography>
      <Typography variant="body1">Your AI-powered real estate broker assistant.</Typography>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          If you don't already have an account, press the 'Sign Up' button below to create one.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleSignUp}
        >
          Sign Up
        </Button>
      </Box>
    </div>
  );
};

export default LandingPage;