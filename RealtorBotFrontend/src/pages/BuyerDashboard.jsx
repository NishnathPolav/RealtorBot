import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { useNavigate } from 'react-router-dom';
import { useTours } from '../components/ToursContext';
import { useAuth } from '../components/AuthContext';
import Chip from '@mui/material/Chip';

const mockSuggestions = [
  { id: 1, title: '789 Pine Rd', price: '$500,000' },
  { id: 2, title: '321 Maple Ln', price: '$420,000' },
];

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { tours, loading } = useTours();
  const { user } = useAuth();

  const handleScheduleTour = () => {
    navigate('/add-edit-tour');
  };

  const handleViewTour = (id) => {
    navigate(`/tour/${id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading your tours...</Typography>
      </Box>
    );
  }

  return (
      <Box>
      <Typography variant="h4" gutterBottom>
        Buyer Dashboard
      </Typography>
      
      {user && (
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Welcome back, {user.email}
        </Typography>
      )}

      <Button variant="contained" color="primary" sx={{ mb: 2 }}>
        Start Conversational Search
      </Button>
      
      <Button variant="contained" color="secondary" sx={{ mb: 2, ml: 2 }} onClick={handleScheduleTour}>
        Schedule New Tour
      </Button>
      
      <Typography variant="h6" gutterBottom>
        Suggested Listings
      </Typography>
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
      
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Your Scheduled Tours ({tours.length})
      </Typography>
      
      {tours.length === 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              You haven't scheduled any tours yet. Click "Schedule New Tour" to get started!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {tours.map(tour => (
            <ListItem key={tour.id} disablePadding sx={{ mb: 2 }}>
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
                onClick={() => handleViewTour(tour.id)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">{tour.property_address}</Typography>
                    <Chip 
                      label={tour.status} 
                      color={getStatusColor(tour.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Date: {formatDate(tour.scheduled_date)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time: {tour.scheduled_time}
                  </Typography>
                  {tour.notes && (
                    <Typography variant="body2" color="text.secondary">
                      Notes: {tour.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </ListItem>
          ))}
        </List>
      )}
      
      <Typography variant="h6" gutterBottom>
        Offers & Negotiations
      </Typography>
      {/* Placeholder for offers/negotiations */}
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No current offers or negotiations.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BuyerDashboard;