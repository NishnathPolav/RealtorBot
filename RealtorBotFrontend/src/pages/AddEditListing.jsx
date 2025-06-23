import React, { useRef, useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Input from '@mui/material/Input';
import { useListings } from '../components/ListingsContext';
import { useNavigate, useParams } from 'react-router-dom';

const AddEditListing = () => {
  const fileInputRef = useRef();
  const { addListing, editListing, listings } = useListings();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const existing = isEdit ? listings.find(l => l.id === Number(id)) : null;
  const [form, setForm] = useState({
    title: '',
    address: '',
    price: '',
    description: '',
    photo: null,
  });

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        title: existing.title || '',
        address: existing.address || '',
        price: existing.price || '',
        description: existing.description || '',
        photo: null,
      });
    }
  }, [isEdit, existing]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isEdit) {
      editListing(existing.id, form);
    } else {
      addListing(form);
    }
    navigate('/seller-dashboard');
  };

  const handleCancel = () => {
    navigate('/seller-dashboard');
  };

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
            Save
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