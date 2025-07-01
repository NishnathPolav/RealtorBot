import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTours } from '../components/ToursContext';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

const TourDetails = () => {
  const { id } = useParams();
  const { deleteTour, getTour } = useTours();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        const data = await getTour(id);
        setTour(data);
      } catch (error) {
        console.error('Failed to fetch tour:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTour();
    }
  }, [id, getTour]);

  const handleEdit = () => {
    navigate(`/add-edit-tour/${tour.id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to cancel this tour?')) {
      try {
        await deleteTour(tour.id);
        navigate('/buyer-dashboard');
      } catch (error) {
        console.error('Failed to delete tour:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tour) {
    return (
      <Box maxWidth={600} mx="auto" mt={8} p={3}>
        <Typography variant="h6" color="error">
          {error || 'Tour not found.'}
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" gutterBottom>
              Property Tour
            </Typography>
            <Chip 
              label={tour.status} 
              color={getStatusColor(tour.status)}
              variant="outlined"
            />
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Property Address
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            {tour.property_address}
          </Typography>

          <Typography variant="h6" gutterBottom>
            Scheduled Date
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            {formatDate(tour.scheduled_date)}
          </Typography>

          <Typography variant="h6" gutterBottom>
            Scheduled Time
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            {tour.scheduled_time}
          </Typography>

          {tour.notes && (
            <>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                {tour.notes}
              </Typography>
            </>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Created: {new Date(tour.created_at).toLocaleDateString()}
          </Typography>
        </CardContent>
      </Card>
      
      <Box display="flex" gap={2} mt={2}>
        <Button variant="contained" color="primary" onClick={handleEdit}>
          Edit Tour
        </Button>
        <Button variant="outlined" color="error" onClick={handleDelete}>
          Cancel Tour
        </Button>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default TourDetails; 