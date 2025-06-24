//import React from 'react';
//import Typography from '@mui/material/Typography';

//const Chat = () => (
  //<div>
    //<Typography variant="h4" gutterBottom>Chat</Typography>
    //{/* Conversational AI agent handling tasks */}
  //</div>
//);

//export default Chat;

import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
const Chat = () => {
  const navigate = useNavigate();
  const handleSignup = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <Box display="flex" flexDirection="column" sx={{ height: '70vh' }}>
      <Typography variant="h4" gutterBottom>Chat</Typography>
      <Paper sx={{ flex: 1, p: 2, mb: 2, overflowY: 'auto' }}>
        <Typography variant="body2" color="text.secondary">
          Conversation will appear here.
        </Typography>
      </Paper>
      <Box textAlign="center" mt={2}>
        <Typography variant="body1" gutterBottom>
          Please Sign Up or Log In to get Started
        </Typography>
        <Box display="flex" justifyContent="center" gap={2}>
          <Button variant="contained" color="primary" onClick={handleSignup}>
            Sign Up
          </Button>
          <Button variant="outlined" color="primary" onClick={handleLogin}>
            Log In
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;