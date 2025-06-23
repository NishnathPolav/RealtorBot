import React from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';

const ChooseMode = () => {
  const { user, signup } = useAuth();
  const navigate = useNavigate();

  const handleChoose = async (role) => {
    // Update the user's role in context (simulate signup with new role)
    await signup(user.email, 'mock', role); // password is not used in mock
    if (role === 'seller') {
      navigate('/seller-dashboard');
    } else {
      navigate('/buyer-dashboard');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={3} boxShadow={3} borderRadius={2} textAlign="center">
      <Typography variant="h4" gutterBottom>Choose Mode</Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ m: 1, minWidth: 120 }}
        onClick={() => handleChoose('seller')}
      >
        Seller
      </Button>
      <Button
        variant="contained"
        color="secondary"
        sx={{ m: 1, minWidth: 120 }}
        onClick={() => handleChoose('buyer')}
      >
        Buyer
      </Button>
    </Box>
  );
};

export default ChooseMode;