import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { useNavigate } from 'react-router-dom';
import { useListings } from '../components/ListingsContext';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { listings } = useListings();

  const handleAddListing = () => {
    navigate('/add-edit-listing');
  };

  const handleViewListing = (id) => {
    navigate(`/listing/${id}`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Seller Dashboard</Typography>
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleAddListing}>
        Add New Listing
      </Button>
      <Typography variant="h6" gutterBottom>Active Listings</Typography>
      <List>
        {listings.map(listing => (
          <ListItem key={listing.id} disablePadding sx={{ mb: 2 }}>
            <Card
              sx={{
                width: '100%',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, background 0.2s',
                '&:hover': {
                  boxShadow: 8,
                  background: '#f0f4ff',
                },
              }}
              elevation={3}
              onClick={() => handleViewListing(listing.id)}
            >
              <CardContent>
                <Typography variant="subtitle1">{listing.title}</Typography>
                <Typography variant="body2" color="text.secondary">Status: {listing.status}</Typography>
              </CardContent>
            </Card>
          </ListItem>
        ))}
      </List>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Recent Offers & Messages</Typography>
      {/* Placeholder for offers/messages */}
      <Card sx={{ mb: 2 }}><CardContent>No recent offers or messages.</CardContent></Card>
      <Typography variant="h6" gutterBottom>Upcoming Tours</Typography>
      {/* Placeholder for tours */}
      <Card><CardContent>No upcoming tours.</CardContent></Card>
    </Box>
  );
};

export default SellerDashboard;