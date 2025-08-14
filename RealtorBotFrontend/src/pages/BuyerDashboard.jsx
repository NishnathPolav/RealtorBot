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
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CircularProgress from '@mui/material/CircularProgress';

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
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{ 
          background: 'var(--background-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          p: 4
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: 'var(--primary-color)', mb: 2 }} />
          <Typography variant="h6" color="var(--text-secondary)">
            Loading your dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  // If chat is open, show only the chat interface
  if (showChat) {
    return (
      <Container maxWidth="lg">
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ color: 'var(--primary-color)', fontWeight: 600 }}>
              AI Property Assistant
            </Typography>
            <Button 
              variant="outlined" 
              onClick={handleToggleChat}
              sx={{
                borderColor: 'var(--primary-color)',
                color: 'var(--primary-color)',
                '&:hover': {
                  borderColor: 'var(--primary-dark)',
                  background: 'rgba(37, 99, 235, 0.1)',
                }
              }}
            >
              Back to Dashboard
            </Button>
          </Box>
          <Chat onClose={() => setShowChat(false)} />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header Section */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 'var(--radius-xl)',
          background: 'var(--gradient-primary)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              mb: 1,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Buyer Dashboard
          </Typography>
          
          {user && (
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300, mb: 3 }}>
              Welcome back, {user.email}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              onClick={handleToggleChat}
              startIcon={<SearchIcon />}
              sx={{ 
                bgcolor: 'white',
                color: 'var(--primary-color)',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                '&:hover': {
                  bgcolor: 'var(--background-tertiary)',
                  transform: 'translateY(-2px)',
                  boxShadow: 'var(--shadow-xl)',
                }
              }}
            >
              AI Property Assistant
            </Button>
          </Box>
        </Box>
        
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)',
            backgroundSize: '50px 50px',
            zIndex: 1
          }}
        />
      </Paper>

      {/* Filters Section */}
      <Paper 
        sx={{ 
          mb: 4, 
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}
      >
        <Accordion sx={{ boxShadow: 'none' }}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              background: 'var(--background-secondary)',
              '&:hover': {
                background: 'var(--background-tertiary)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FilterListIcon sx={{ color: 'var(--primary-color)' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Property Filters
              </Typography>
              {hasActiveFilters && (
                <Chip 
                  label={`${filteredListings.length} of ${listings.length}`} 
                  size="small" 
                  color="primary" 
                  sx={{ 
                    ml: 1,
                    fontWeight: 600,
                    background: 'var(--primary-color)'
                  }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Location Filter */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="City, State, or Address"
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'var(--text-light)' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 'var(--radius-md)',
                      '&:hover fieldset': {
                        borderColor: 'var(--primary-light)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--primary-color)',
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Grid>

              {/* Price Range */}
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  Price Range
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Min Price"
                    type="text"
                    value={getFormattedPrice('priceMin')}
                    onChange={(e) => handlePriceChange('priceMin', e.target.value)}
                    placeholder="Min"
                    size="small"
                    sx={{ flex: 1 }}
                    InputProps={{
                      startAdornment: <AttachMoneyIcon sx={{ mr: 1, color: 'var(--text-light)' }} />,
                    }}
                  />
                  <TextField
                    label="Max Price"
                    type="text"
                    value={getFormattedPrice('priceMax')}
                    onChange={(e) => handlePriceChange('priceMax', e.target.value)}
                    placeholder="Max"
                    size="small"
                    sx={{ flex: 1 }}
                    InputProps={{
                      startAdornment: <AttachMoneyIcon sx={{ mr: 1, color: 'var(--text-light)' }} />,
                    }}
                  />
                </Box>
              </Grid>

              {/* Bedrooms */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Min Bedrooms</InputLabel>
                  <Select
                    value={filters.bedrooms}
                    onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                    label="Min Bedrooms"
                    startAdornment={<BedIcon sx={{ mr: 1, color: 'var(--text-light)' }} />}
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="1">1+</MenuItem>
                    <MenuItem value="2">2+</MenuItem>
                    <MenuItem value="3">3+</MenuItem>
                    <MenuItem value="4">4+</MenuItem>
                    <MenuItem value="5">5+</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Bathrooms */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Min Bathrooms</InputLabel>
                  <Select
                    value={filters.bathrooms}
                    onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                    label="Min Bathrooms"
                    startAdornment={<BathtubIcon sx={{ mr: 1, color: 'var(--text-light)' }} />}
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="1">1+</MenuItem>
                    <MenuItem value="2">2+</MenuItem>
                    <MenuItem value="3">3+</MenuItem>
                    <MenuItem value="4">4+</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Property Type */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Property Type</InputLabel>
                  <Select
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                    label="Property Type"
                    startAdornment={<HomeIcon sx={{ mr: 1, color: 'var(--text-light)' }} />}
                  >
                    <MenuItem value="">Any</MenuItem>
                    {getUniqueValues('propertyType').map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Clear Filters Button */}
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  fullWidth
                  sx={{
                    borderColor: 'var(--error-color)',
                    color: 'var(--error-color)',
                    '&:hover': {
                      borderColor: 'var(--error-color)',
                      background: 'rgba(220, 38, 38, 0.1)',
                    },
                    '&:disabled': {
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-light)',
                    }
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>
      
      {/* Listings Section */}
      <Paper 
        sx={{ 
          mb: 4, 
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, background: 'var(--background-secondary)', borderBottom: '1px solid var(--border-light)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            Available Listings ({filteredListings.length})
          </Typography>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {filteredListings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SearchIcon sx={{ fontSize: 60, color: 'var(--text-light)', mb: 2 }} />
              <Typography variant="h6" color="var(--text-secondary)" sx={{ mb: 1 }}>
                {hasActiveFilters 
                  ? 'No properties match your current filters'
                  : 'No properties available at the moment'
                }
              </Typography>
              <Typography variant="body2" color="var(--text-light)">
                {hasActiveFilters 
                  ? 'Try adjusting your criteria or clearing some filters.'
                  : 'Check back later for new listings.'
                }
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredListings.map(listing => (
                <Grid item xs={12} md={6} lg={4} key={listing.id}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-md)',
                      border: '1px solid var(--border-light)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 'var(--shadow-xl)',
                        borderColor: 'var(--primary-light)',
                      },
                    }}
                    onClick={() => handleViewListing(listing.id)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 2, 
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3
                        }}
                      >
                        {listing.title}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="body2" 
                          color="var(--text-secondary)" 
                          sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                        >
                          <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: 'var(--text-light)' }} />
                          {[listing.street, listing.city, listing.state, listing.zip].filter(Boolean).join(', ') || listing.address}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          mb: 2,
                          color: 'var(--primary-color)',
                          fontWeight: 700
                        }}
                      >
                        ${listing.price?.toLocaleString()}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {listing.bedrooms && (
                          <Chip 
                            icon={<BedIcon />}
                            label={`${listing.bedrooms} bed`} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: 'var(--primary-light)',
                              color: 'var(--primary-color)',
                              fontWeight: 500
                            }}
                          />
                        )}
                        {listing.bathrooms && (
                          <Chip 
                            icon={<BathtubIcon />}
                            label={`${listing.bathrooms} bath`} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: 'var(--secondary-light)',
                              color: 'var(--secondary-color)',
                              fontWeight: 500
                            }}
                          />
                        )}
                        {listing.squareFootage && (
                          <Chip 
                            icon={<SquareFootIcon />}
                            label={`${listing.squareFootage.toLocaleString()} sqft`} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: 'var(--accent-color)',
                              color: 'var(--accent-color)',
                              fontWeight: 500
                            }}
                          />
                        )}
                        {listing.propertyType && (
                          <Chip 
                            icon={<HomeIcon />}
                            label={listing.propertyType} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: 'var(--success-color)',
                              color: 'var(--success-color)',
                              fontWeight: 500
                            }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
      
      {/* Tours Section */}
      <Paper 
        sx={{ 
          mb: 4, 
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, background: 'var(--background-secondary)', borderBottom: '1px solid var(--border-light)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            Your Scheduled Tours ({tours.length})
          </Typography>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {tours.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CalendarTodayIcon sx={{ fontSize: 60, color: 'var(--text-light)', mb: 2 }} />
              <Typography variant="h6" color="var(--text-secondary)" sx={{ mb: 1 }}>
                No tours scheduled yet
              </Typography>
              <Typography variant="body2" color="var(--text-light)" sx={{ mb: 2 }}>
                Schedule a tour to see properties in person.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/add-edit-tour')}
                startIcon={<CalendarTodayIcon />}
                sx={{
                  background: 'var(--primary-color)',
                  '&:hover': {
                    background: 'var(--primary-dark)',
                  }
                }}
              >
                Schedule Your First Tour
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {tours.map(tour => (
                <Grid item xs={12} md={6} key={tour.id}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-md)',
                      border: '1px solid var(--border-light)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 'var(--shadow-lg)',
                        borderColor: 'var(--secondary-light)',
                      },
                    }}
                    onClick={() => handleViewTour(tour.id)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            flex: 1
                          }}
                        >
                          {[tour.street, tour.city, tour.state, tour.zip].filter(Boolean).join(', ')}
                        </Typography>
                        <Chip 
                          label={tour.status} 
                          color={getStatusColor(tour.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <CalendarTodayIcon sx={{ fontSize: 20, color: 'var(--text-light)' }} />
                        <Typography variant="body2" color="var(--text-secondary)">
                          {formatDate(tour.scheduled_date)}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="var(--text-secondary)" sx={{ mb: 1 }}>
                        Time: {tour.scheduled_time}
                      </Typography>
                      
                      {tour.notes && (
                        <Typography 
                          variant="body2" 
                          color="var(--text-secondary)"
                          sx={{ 
                            mt: 2,
                            p: 2,
                            background: 'var(--background-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '3px solid var(--primary-color)'
                          }}
                        >
                          <strong>Notes:</strong> {tour.notes}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
      
      {/* Offers Section */}
      <Paper 
        sx={{ 
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, background: 'var(--background-secondary)', borderBottom: '1px solid var(--border-light)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            Offers & Negotiations
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <AttachMoneyIcon sx={{ fontSize: 60, color: 'var(--text-light)', mb: 2 }} />
            <Typography variant="h6" color="var(--text-secondary)" sx={{ mb: 1 }}>
              No current offers or negotiations
            </Typography>
            <Typography variant="body2" color="var(--text-light)">
              When you make an offer on a property, it will appear here.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default BuyerDashboard;