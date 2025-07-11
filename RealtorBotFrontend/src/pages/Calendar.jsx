import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { getPropertyById } from '../services/conversationalAPI';
import { toursAPI } from '../services/api';

// Helper to get query param
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Calendar = () => {
  const query = useQuery();
  const propertyId = query.get('propertyId');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await getPropertyById(propertyId);
        setProperty(data);
      } catch (err) {
        setError('Failed to load property details.');
      }
    };
    if (propertyId) fetchProperty();
  }, [propertyId]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !property) return;
    setLoading(true);
    setError('');
    try {
      await toursAPI.create({
        property_id: property.id,
        seller_id: property.seller_id,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        notes: ''
      });
      setConfirmation(`Tour scheduled for ${dayjs(selectedDate).format('MMMM D, YYYY')} at ${selectedTime}! The seller will be notified.`);
    } catch (err) {
      setError('Failed to schedule tour. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={3} boxShadow={3} borderRadius={2}>
      <Typography variant="h4" gutterBottom>Schedule a Tour</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Typography variant="body1" gutterBottom>
        Select a date and time for your tour:
      </Typography>
      <TextField
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        type="time"
        value={selectedTime}
        onChange={handleTimeChange}
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSchedule}
        disabled={!selectedDate || !selectedTime || loading}
        fullWidth
        sx={{ mt: 2 }}
      >
        {loading ? 'Scheduling...' : 'Schedule Tour'}
      </Button>
      {confirmation && (
        <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
          {confirmation}
        </Typography>
      )}
      <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate(-1)}>
        Back
      </Button>
    </Box>
  );
};

export default Calendar; 