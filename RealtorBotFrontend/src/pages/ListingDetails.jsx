import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListings } from '../components/ListingsContext';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const ListingDetails = () => {
  const { id } = useParams();
  const { listings, deleteListing } = useListings();
  const navigate = useNavigate();
  const listing = listings.find(l => l.id === Number(id));

  if (!listing) {
    return <Typography variant="h6">Listing not found.</Typography>;
  }

  const handleEdit = () => {
    navigate(`/add-edit-listing/${listing.id}`);
  };

  const handleDelete = () => {
    deleteListing(listing.id);
    navigate('/seller-dashboard');
  };

  return (
    <Box maxWidth={600} mx="auto" mt={8} p={3}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>{listing.title}</Typography>
          <Typography variant="subtitle1" gutterBottom>Status: {listing.status}</Typography>
          <Typography variant="body1" gutterBottom>Address: {listing.address}</Typography>
          <Typography variant="body1" gutterBottom>Price: ${listing.price}</Typography>
          <Typography variant="body1" gutterBottom>Description: {listing.description}</Typography>
          {/* Optionally show photo if available */}
        </CardContent>
      </Card>
      <Box display="flex" gap={2} mt={2}>
        <Button variant="contained" color="primary" onClick={handleEdit}>
          Edit
        </Button>
        <Button variant="outlined" color="error" onClick={handleDelete}>
          Delete
        </Button>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default ListingDetails; 