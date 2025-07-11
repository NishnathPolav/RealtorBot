import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListings } from '../components/ListingsContext';
import { useAuth } from '../components/AuthContext';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

const ListingDetails = () => {
  const { id } = useParams();
  const { deleteListing, getListing } = useListings();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const data = await getListing(id);
        setListing(data);
      } catch (error) {
        console.error('Failed to fetch listing:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id, getListing]);

  const handleEdit = () => {
    navigate(`/add-edit-listing/${listing.id}`);
  };

  const handleDelete = async () => {
    try {
      await deleteListing(listing.id);
      navigate('/seller-dashboard');
    } catch (error) {
      console.error('Failed to delete listing:', error);
    }
  };

  const handleScheduleTour = () => {
    navigate(`/calendar?propertyId=${listing.id}`);
  };

  // Helper to format price with commas and dollar sign
  const formatPrice = (price) => {
    if (price === undefined || price === null || price === '') return '';
    const num = Number(price);
    if (isNaN(num)) return price;
    return `$${num.toLocaleString()}`;
  };

  // Only show edit/delete if seller and owner
  const canEditOrDelete = user && user.role === 'seller' && listing && listing.seller_id === user.id;
  // Show schedule tour if not the owner
  const canScheduleTour = user && (!canEditOrDelete);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !listing) {
    return (
      <Box maxWidth={600} mx="auto" mt={8} p={3}>
        <Typography variant="h6" color="error">
          {error || 'Property not found.'}
        </Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth={600} mx="auto" mt={8} p={3}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>{listing.title}</Typography>
          <Typography variant="subtitle1" gutterBottom>Status: {listing.status}</Typography>
          <Typography variant="body1" gutterBottom>Address: {[listing.street, listing.city, listing.state, listing.zip].filter(Boolean).join(', ')}</Typography>
          <Typography variant="body1" gutterBottom>Price: {formatPrice(listing.price)}</Typography>
          <Typography variant="body1" gutterBottom>Description: {listing.description}</Typography>
          {listing.features && listing.features.length > 0 && (
            <Typography variant="body1" gutterBottom>
              Features: {listing.features.join(', ')}
            </Typography>
          )}
        </CardContent>
      </Card>
      <Box display="flex" gap={2} mt={2}>
        {canEditOrDelete && (
          <>
            <Button variant="contained" color="primary" onClick={handleEdit}>
              Edit
            </Button>
            <Button variant="outlined" color="error" onClick={handleDelete}>
              Delete
            </Button>
          </>
        )}
        {canScheduleTour && (
          <Button variant="contained" color="secondary" onClick={handleScheduleTour}>
            Schedule Tour
          </Button>
        )}
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default ListingDetails; 