import React, { useRef, useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Input from '@mui/material/Input';
import CircularProgress from '@mui/material/CircularProgress';
import { useListings } from '../components/ListingsContext';
import { useNavigate, useParams } from 'react-router-dom';

const AddEditListing = () => {
  const fileInputRef = useRef();
  const { addListing, editListing, getListing } = useListings();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: '',
    address: '',
    price: '',
    description: '',
    photo: null,
  });

  useEffect(() => {
    const fetchListing = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const listing = await getListing(id);
          setForm({
            title: listing.title || '',
            address: listing.address || '',
            price: listing.price || '',
            description: listing.description || '',
            photo: null,
          });
        } catch (error) {
          console.error('Failed to fetch listing:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchListing();
  }, [isEdit, id, getListing]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await editListing(id, form);
      } else {
        await addListing(form);
      }
      navigate('/seller-dashboard');
    } catch (error) {
      console.error('Failed to save listing:', error);
      setError(error.message);
    }
  };

  const handleCancel = () => {
    navigate('/seller-dashboard');
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
      <Typography variant="h4" gutterBottom>{isEdit ? 'Edit Listing' : 'Add Listing'}</Typography>
      <form onSubmit={handleSave}>
        <TextField
          label="Property Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Price"
          name="price"
          type="number"
          value={form.price}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          fullWidth
          margin="normal"
          multiline
          minRows={3}
        />
        <Box mt={2} mb={2}>
          <Input
            inputRef={fileInputRef}
            type="file"
            name="photo"
            inputProps={{ accept: 'image/*' }}
            onChange={handleChange}
            fullWidth
          />
        </Box>
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button variant="contained" color="primary" type="submit">
            {isEdit ? 'Update' : 'Save'}
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default AddEditListing;