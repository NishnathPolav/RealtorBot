import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

const mockSuggestions = [
  { id: 1, title: '789 Pine Rd', price: '$500,000' },
  { id: 2, title: '321 Maple Ln', price: '$420,000' },
];

const BuyerDashboard = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Buyer Dashboard</Typography>
    <Button variant="contained" color="primary" sx={{ mb: 2 }}>
      Start Conversational Search
    </Button>
    <Typography variant="h6" gutterBottom>Suggested Listings</Typography>
    <List>
      {mockSuggestions.map(listing => (
        <ListItem key={listing.id}>
          <Card sx={{ width: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1">{listing.title}</Typography>
              <Typography variant="body2" color="text.secondary">Price: {listing.price}</Typography>
            </CardContent>
          </Card>
        </ListItem>
      ))}
    </List>
    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Scheduled Tours</Typography>
    {/* Placeholder for tours */}
    <Card sx={{ mb: 2 }}><CardContent>No scheduled tours.</CardContent></Card>
    <Typography variant="h6" gutterBottom>Offers & Negotiations</Typography>
    {/* Placeholder for offers/negotiations */}
    <Card><CardContent>No current offers or negotiations.</CardContent></Card>
  </Box>
);

export default BuyerDashboard;