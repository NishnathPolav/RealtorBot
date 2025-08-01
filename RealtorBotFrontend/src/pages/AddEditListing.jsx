import React, { useRef, useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Input from '@mui/material/Input';
import CircularProgress from '@mui/material/CircularProgress';
import { useListings } from '../components/ListingsContext';
import { useNavigate, useParams } from 'react-router-dom';
import MenuItem from '@mui/material/MenuItem';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

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
    street: '',
    city: '',
    state: '',
    zip: '',
    price: '', // Store raw number as string
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    description: '',
    photo: null,
  });
  const [displayPrice, setDisplayPrice] = useState(''); // For formatted price

  useEffect(() => {
    const fetchListing = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const listing = await getListing(id);
          setForm({
            title: listing.title || '',
            street: listing.street || '',
            city: listing.city || '',
            state: listing.state || '',
            zip: listing.zip || '',
            price: listing.price || '',
            bedrooms: listing.bedrooms || '',
            bathrooms: listing.bathrooms || '',
            squareFootage: listing.squareFootage || '',
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

  const formatPrice = (value) => {
    if (!value) return '';
    // Remove all non-digit characters
    const numeric = value.replace(/[^\d]/g, '');
    if (!numeric) return '';
    // Format with commas
    const withCommas = Number(numeric).toLocaleString();
    return `$${withCommas}`;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'price') {
      // Remove all non-digit characters for storage
      const numeric = value.replace(/[^\d]/g, '');
      setForm((prev) => ({
        ...prev,
        price: numeric,
      }));
      setDisplayPrice(formatPrice(value));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    }
  };

  useEffect(() => {
    // When loading a listing for edit, format the price for display
    if (isEdit && form.price !== undefined && form.price !== null) {
      setDisplayPrice(formatPrice(form.price.toString()));
    }
    // eslint-disable-next-line
  }, [form.price, isEdit]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const listingData = {
        ...form,
        price: form.price ? Number(form.price) : '', // Ensure price is a number
      };
      if (isEdit) {
        await editListing(id, listingData);
      } else {
        await addListing(listingData);
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
          label="Street Address"
          name="street"
          value={form.street}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="City"
          name="city"
          value={form.city}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="State"
          name="state"
          value={form.state}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          select
        >
          {US_STATES.map((state) => (
            <MenuItem key={state} value={state}>{state}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Zip Code"
          name="zip"
          value={form.zip}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Price"
          name="price"
          type="text"
          value={displayPrice}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Bedrooms"
          name="bedrooms"
          type="number"
          value={form.bedrooms}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Bathrooms"
          name="bathrooms"
          type="number"
          value={form.bathrooms}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Square Footage"
          name="squareFootage"
          type="number"
          value={form.squareFootage}
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