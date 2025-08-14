import React, { useState, useMemo, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTours } from '../components/ToursContext';
import { useAuth } from '../components/AuthContext';
import Chip from '@mui/material/Chip';
import { useListings } from '../components/ListingsContext';
import Chat from './Chat';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tours, loading: toursLoading } = useTours();
  const { user } = useAuth();
  const { listings, loading: listingsLoading } = useListings();
  const [showChat, setShowChat] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    location: '',
    priceMin: '',
    priceMax: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    features: []
  });

  // Load filters from URL parameters on component mount
  useEffect(() => {
    const urlFilters = {
      location: searchParams.get('location') || '',
      priceMin: searchParams.get('priceMin') || '',
      priceMax: searchParams.get('priceMax') || '',
      bedrooms: searchParams.get('bedrooms') || '',
      bathrooms: searchParams.get('bathrooms') || '',
      propertyType: searchParams.get('propertyType') || '',
      features: []
    };

    // Only update filters if URL parameters exist
    const hasUrlParams = Object.values(urlFilters).some(value => value !== '');
    if (hasUrlParams) {
      setFilters(urlFilters);
    }
  }, [searchParams]);

  const handleScheduleTour = () => {
    navigate('/add-edit-tour');
  };

  const handleViewTour = (id) => {
    navigate(`/tour/${id}`);
  };

  const handleViewListing = (id) => {
    navigate(`/listing/${id}`);
  };

  const handleToggleChat = () => {
    setShowChat(!showChat);
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Format price input with commas
  const formatPriceInput = (value) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/[^\d]/g, '');
    // Add commas for thousands
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Handle price input changes with formatting
  const handlePriceChange = (field, value) => {
    // Remove commas for storage, but format for display
    const numericValue = value.replace(/[^\d]/g, '');
    setFilters(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  // Get formatted price for display
  const getFormattedPrice = (field) => {
    const value = filters[field];
    if (!value) return '';
    return formatPriceInput(value);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      location: '',
      priceMin: '',
      priceMax: '',
      bedrooms: '',
      bathrooms: '',
      propertyType: '',
      features: []
    });
  };

  // Get unique values for filter options with sensible defaults
  const getUniqueValues = (field) => {
    const values = listings.map(listing => listing[field]).filter(Boolean);
    const unique = [...new Set(values.map(v => typeof v === 'string' ? v.trim() : v))].filter(Boolean);
    if (field === 'propertyType') {
      const defaults = ['House', 'Apartment', 'Condo', 'Townhouse', 'Duplex'];
      const merged = Array.from(new Set([...defaults, ...unique]));
      return merged.sort();
    }
    return unique.sort();
  };

  // Filter listings based on current filters
  const filteredListings = useMemo(() => {
    const wantedLocation = filters.location?.toLowerCase().trim() || '';
    const wantedType = filters.propertyType?.toLowerCase().trim() || '';
    const minPrice = filters.priceMin ? parseInt(filters.priceMin, 10) : null;
    const maxPrice = filters.priceMax ? parseInt(filters.priceMax, 10) : null;
    const minBeds = filters.bedrooms ? parseInt(filters.bedrooms, 10) : null;
    const minBaths = filters.bathrooms ? parseInt(filters.bathrooms, 10) : null;

    return listings.filter(listing => {
      const city = listing.city?.toLowerCase() || '';
      const state = listing.state?.toLowerCase() || '';
      const zip = (listing.zip || '').toString().toLowerCase();
      const address = listing.address?.toLowerCase() || '';
      const street = listing.street?.toLowerCase() || '';
      const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');

      // Location filter (match city/state/zip/street/address)
      if (wantedLocation) {
        const matchesLocation =
          city.includes(wantedLocation) ||
          state.includes(wantedLocation) ||
          zip.includes(wantedLocation) ||
          address.includes(wantedLocation) ||
          fullAddress.includes(wantedLocation);
        if (!matchesLocation) return false;
      }

      // Price range filter
      if (minPrice !== null && Number.isFinite(minPrice) && listing.price < minPrice) return false;
      if (maxPrice !== null && Number.isFinite(maxPrice) && listing.price > maxPrice) return false;

      // Bedrooms filter
      if (minBeds !== null && Number.isFinite(minBeds) && (listing.bedrooms || 0) < minBeds) return false;

      // Bathrooms filter
      if (minBaths !== null && Number.isFinite(minBaths) && (listing.bathrooms || 0) < minBaths) return false;

      // Property type filter: match if the first word of title equals the selected type
      // Fallback to listing.propertyType exact match when available
      if (wantedType) {
        const title = listing.title || '';
        const firstWordMatch = (title.trim().match(/^[A-Za-z]+/i) || [''])[0].toLowerCase();
        const typeMatchByTitle = firstWordMatch === wantedType;
        const typeMatchByField = (listing.propertyType || '').toString().toLowerCase() === wantedType;
        if (!typeMatchByTitle && !typeMatchByField) return false;
      }

      return true;
    });
  }, [listings, filters]);

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

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null && value !== undefined && 
    (Array.isArray(value) ? value.length > 0 : true)
  );

  if (toursLoading || listingsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading your dashboard...</Typography>
      </Box>
    );
  }

  // If chat is open, show only the chat interface
  if (showChat) {
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">AI Property Assistant</Typography>
          <Button variant="outlined" onClick={handleToggleChat}>
            Back to Dashboard
          </Button>
        </Box>
        <Chat onClose={() => setShowChat(false)} />
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
        <Button variant="contained" color="secondary" onClick={handleToggleChat} sx={{ mr: 2 }}>
          AI Property Assistant
        </Button>
        <Button variant="outlined" onClick={() => navigate('/add-edit-tour')}>
          Schedule Tour
        </Button>
      </Box>

      {/* Filters Section */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon />
            <Typography variant="h6">Property Filters</Typography>
            {hasActiveFilters && (
              <Chip 
                label={`${filteredListings.length} of ${listings.length}`} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            {/* Location Filter */}
            <TextField
              label="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="City, State, or Address"
              fullWidth
              size="small"
            />

            {/* Price Range */}
            <Box>
              <Typography variant="body2" gutterBottom>Price Range</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Min Price"
                  type="text" // Changed to text to allow commas
                  value={getFormattedPrice('priceMin')}
                  onChange={(e) => handlePriceChange('priceMin', e.target.value)}
                  placeholder="Min"
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Max Price"
                  type="text" // Changed to text to allow commas
                  value={getFormattedPrice('priceMax')}
                  onChange={(e) => handlePriceChange('priceMax', e.target.value)}
                  placeholder="Max"
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>

            {/* Bedrooms */}
            <FormControl fullWidth size="small">
              <InputLabel>Min Bedrooms</InputLabel>
              <Select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                label="Min Bedrooms"
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="1">1+</MenuItem>
                <MenuItem value="2">2+</MenuItem>
                <MenuItem value="3">3+</MenuItem>
                <MenuItem value="4">4+</MenuItem>
                <MenuItem value="5">5+</MenuItem>
              </Select>
            </FormControl>

            {/* Bathrooms */}
            <FormControl fullWidth size="small">
              <InputLabel>Min Bathrooms</InputLabel>
              <Select
                value={filters.bathrooms}
                onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                label="Min Bathrooms"
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="1">1+</MenuItem>
                <MenuItem value="2">2+</MenuItem>
                <MenuItem value="3">3+</MenuItem>
                <MenuItem value="4">4+</MenuItem>
              </Select>
            </FormControl>

            {/* Property Type */}
            <FormControl fullWidth size="small">
              <InputLabel>Property Type</InputLabel>
              <Select
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                label="Property Type"
              >
                <MenuItem value="">Any</MenuItem>
                {getUniqueValues('propertyType').map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Clear Filters Button */}
            <Box sx={{ display: 'flex', alignItems: 'end' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                fullWidth
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      <Typography variant="h6" gutterBottom>
        Available Listings ({filteredListings.length})
      </Typography>
      <List>
        {filteredListings.length === 0 ? (
          <ListItem>
            <Typography variant="body1" color="text.secondary">
              {hasActiveFilters 
                ? 'No properties match your current filters. Try adjusting your criteria.'
                : 'No properties available at the moment.'
              }
            </Typography>
          </ListItem>
        ) : (
          filteredListings.map(listing => (
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>{listing.title}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Address: {[listing.street, listing.city, listing.state, listing.zip].filter(Boolean).join(', ') || listing.address}
                      </Typography>
                      <Typography variant="h6" color="primary" gutterBottom>
                        ${listing.price?.toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {listing.bedrooms && (
                          <Chip label={`${listing.bedrooms} bed`} size="small" variant="outlined" />
                        )}
                        {listing.bathrooms && (
                          <Chip label={`${listing.bathrooms} bath`} size="small" variant="outlined" />
                        )}
                        {listing.squareFootage && (
                          <Chip label={`${listing.squareFootage.toLocaleString()} sqft`} size="small" variant="outlined" />
                        )}
                        {listing.propertyType && (
                          <Chip label={listing.propertyType} size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  </Box>
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