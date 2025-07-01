import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { useTours } from '../components/ToursContext';
import { useNavigate, useParams } from 'react-router-dom';

const AddEditTour = () => {
  const { addTour, editTour, getTour } = useTours();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    property_address: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
  });

  // Time slots for dropdown
  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM'
  ];

  useEffect(() => {
    const fetchTour = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const tour = await getTour(id);
          setForm({
            property_address: tour.property_address || '',
            scheduled_date: tour.scheduled_date || '',
            scheduled_time: tour.scheduled_time || '',
            notes: tour.notes || '',
          });
        } catch (error) {
          console.error('Failed to fetch tour:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTour();
  }, [isEdit, id, getTour]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await editTour(id, form);
      } else {
        await addTour(form);
      }
      navigate('/buyer-dashboard');
    } catch (error) {
      console.error('Failed to save tour:', error);
      setError(error.message);
    }
  };

  const handleCancel = () => {
    navigate('/buyer-dashboard');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxWidth={500} mx="auto" mt={8} p={3} boxShadow={3} borderRadius={2}>
        <Typography variant="h6" color="error" gutterBottom>
          Error: {error}
        </Typography>
        <Button variant="outlined" onClick={handleCancel}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth={500} mx="auto" mt={8} p={3} boxShadow={3} borderRadius={2}>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Edit Tour' : 'Schedule New Tour'}
      </Typography>
      <form onSubmit={handleSave}>
        <TextField
          label="Property Address"
          name="property_address"
          value={form.property_address}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          placeholder="Enter the full property address"
        />
        <TextField
          label="Date"
          name="scheduled_date"
          type="date"
          value={form.scheduled_date}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          select
          label="Time"
          name="scheduled_time"
          value={form.scheduled_time}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        >
          {timeSlots.map((time) => (
            <MenuItem key={time} value={time}>
              {time}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Notes (Optional)"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          fullWidth
          margin="normal"
          multiline
          minRows={3}
          placeholder="Any additional notes about the tour..."
        />
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button variant="contained" color="primary" type="submit">
            {isEdit ? 'Update Tour' : 'Schedule Tour'}
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default AddEditTour; 