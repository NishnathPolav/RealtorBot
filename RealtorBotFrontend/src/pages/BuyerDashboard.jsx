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
import { useListings } from '../components/ListingsContext';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { tours, loading: toursLoading } = useTours();
  const { user } = useAuth();
  const { listings, loading: listingsLoading } = useListings();

  const handleScheduleTour = () => {
    navigate('/add-edit-tour');
  };

  const handleViewTour = (id) => {
    navigate(`/tour/${id}`);
  };

  const handleViewListing = (id) => {
    navigate(`/listing/${id}`);
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

  if (toursLoading || listingsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading your dashboard...</Typography>
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

      <Box sx={{ mb: 3 }}>
        <Button variant="contained" color="secondary" onClick={() => navigate('/conversational-search')}>
          Conversational AI Property Search
        </Button>
      </Box>
      
      <Typography variant="h6" gutterBottom>
        All Available Listings
      </Typography>
      <List>
        {listings.length === 0 ? (
          <ListItem>
            <Typography variant="body1" color="text.secondary">
              No properties available at the moment.
            </Typography>
          </ListItem>
        ) : (
          listings.map(listing => (
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
                  <Typography variant="body2" color="text.secondary">
                    Address: {[listing.street, listing.city, listing.state, listing.zip].filter(Boolean).join(', ') || listing.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Price: ${listing.price?.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </ListItem>
          ))
        )}
      </List>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Your Scheduled Tours ({tours.length})
      </Typography>
      
      {tours.length === 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              You haven't scheduled any tours yet.
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
                    <Typography variant="subtitle1">
                      {[tour.street, tour.city, tour.state, tour.zip].filter(Boolean).join(', ')}
                    </Typography>
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