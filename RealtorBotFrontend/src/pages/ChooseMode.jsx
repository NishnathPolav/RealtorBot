import React from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const ChooseMode = () => (
  <div>
    <Typography variant="h4" gutterBottom>Choose Mode</Typography>
    <Button variant="contained" color="primary" sx={{ m: 1 }}>Seller</Button>
    <Button variant="contained" color="secondary" sx={{ m: 1 }}>Buyer</Button>
  </div>
);

export default ChooseMode;