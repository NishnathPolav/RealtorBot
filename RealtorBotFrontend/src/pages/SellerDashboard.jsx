import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import { useListings } from '../components/ListingsContext';
import { useAuth } from '../components/AuthContext';
import { toursAPI } from '../services/api';
import AddIcon from '@mui/icons-material/Add';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MessageIcon from '@mui/icons-material/Message';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CancelIcon from '@mui/icons-material/Cancel';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { listings, loading } = useListings();
  const { user } = useAuth();
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [toursError, setToursError] = useState(null);

  useEffect(() => {
    const fetchTours = async () => {
      setToursLoading(true);
      setToursError(null);
      try {
        const response = await toursAPI.getSellerTours();
        setTours(response.tours || []);
      } catch (err) {
        setToursError('Failed to load upcoming tours.');
      } finally {
        setToursLoading(false);
      }
    };
    fetchTours();
  }, []);

  const handleAddListing = () => {
    navigate('/add-edit-listing');
  };

  const handleConversationalAI = () => {
    navigate('/chat');
  };

  const handleViewListing = (id) => {
    console.log('Viewing listing with ID:', { id, type: typeof id });
    navigate(`/listing/${id}`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'pending':
        return <ScheduleIcon sx={{ fontSize: 16 }} />;
      case 'sold':
        return <TrendingUpIcon sx={{ fontSize: 16 }} />;
      default:
        return <HomeIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'sold':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
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
              Loading your listings...
            </Typography>
          </Box>
        </Box>
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
          background: 'var(--gradient-secondary)',
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
            Seller Dashboard
          </Typography>
          
          {user && (
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300, mb: 3 }}>
              Welcome back, {user.email}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              onClick={handleAddListing}
              startIcon={<AddIcon />}
              sx={{ 
                bgcolor: 'white',
                color: 'var(--secondary-color)',
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
              Add New Listing
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleConversationalAI}
              startIcon={<SmartToyIcon />}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                borderRadius: 'var(--radius-lg)',
                borderWidth: 2,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              AI Assistant - Create Listing
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

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-light)',
              textAlign: 'center'
            }}
          >
            <Box 
              sx={{ 
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'var(--background-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <HomeIcon sx={{ fontSize: 24, color: 'var(--primary-color)' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)', mb: 1 }}>
              {listings.length}
            </Typography>
            <Typography variant="body2" color="var(--text-secondary)">
              Active Listings
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-light)',
              textAlign: 'center'
            }}
          >
            <Box 
              sx={{ 
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'var(--background-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 24, color: 'var(--secondary-color)' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)', mb: 1 }}>
              {tours.length}
            </Typography>
            <Typography variant="body2" color="var(--text-secondary)">
              Upcoming Tours
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-light)',
              textAlign: 'center'
            }}
          >
            <Box 
              sx={{ 
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'var(--background-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <MessageIcon sx={{ fontSize: 24, color: 'var(--accent-color)' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)', mb: 1 }}>
              0
            </Typography>
            <Typography variant="body2" color="var(--text-secondary)">
              New Messages
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-light)',
              textAlign: 'center'
            }}
          >
            <Box 
              sx={{ 
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'var(--background-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <AttachMoneyIcon sx={{ fontSize: 24, color: 'var(--success-color)' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)', mb: 1 }}>
              0
            </Typography>
            <Typography variant="body2" color="var(--text-secondary)">
              Pending Offers
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Active Listings Section */}
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
            Your Active Listings ({listings.length})
          </Typography>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {listings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <HomeIcon sx={{ fontSize: 60, color: 'var(--text-light)', mb: 2 }} />
              <Typography variant="h6" color="var(--text-secondary)" sx={{ mb: 1 }}>
                No listings yet
              </Typography>
              <Typography variant="body2" color="var(--text-light)" sx={{ mb: 2 }}>
                Get started by creating your first listing or use our AI Assistant for help!
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  onClick={handleAddListing}
                  startIcon={<AddIcon />}
                  sx={{
                    background: 'var(--primary-color)',
                    '&:hover': {
                      background: 'var(--primary-dark)',
                    }
                  }}
                >
                  Create First Listing
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleConversationalAI}
                  startIcon={<SmartToyIcon />}
                  sx={{
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)',
                    '&:hover': {
                      borderColor: 'var(--primary-dark)',
                      background: 'var(--background-accent)',
                    }
                  }}
                >
                  AI Assistant
                </Button>
              </Box>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {listings.map(listing => (
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
                        borderColor: 'var(--border-accent)',
                      },
                    }}
                    onClick={() => handleViewListing(listing.id)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            flex: 1,
                            lineHeight: 1.3
                          }}
                        >
                          {listing.title}
                        </Typography>
                        <Chip 
                          icon={getStatusIcon(listing.status)}
                          label={listing.status} 
                          color={getStatusColor(listing.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="body2" 
                          color="var(--text-secondary)" 
                          sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                        >
                          <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: 'var(--text-light)' }} />
                          {[listing.street, listing.city, listing.state, listing.zip].filter(Boolean).join(', ')}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 2,
                          color: 'var(--primary-color)',
                          fontWeight: 700
                        }}
                      >
                        ${listing.price?.toLocaleString()}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {listing.bedrooms && (
                          <Chip 
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
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
      
      {/* Recent Offers & Messages Section */}
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
            Recent Offers & Messages
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MessageIcon sx={{ fontSize: 60, color: 'var(--text-light)', mb: 2 }} />
            <Typography variant="h6" color="var(--text-secondary)" sx={{ mb: 1 }}>
              No recent offers or messages
            </Typography>
            <Typography variant="body2" color="var(--text-light)">
              When buyers show interest in your properties, offers and messages will appear here.
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Upcoming Tours Section */}
      <Paper 
        sx={{ 
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, background: 'var(--background-secondary)', borderBottom: '1px solid var(--border-light)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            Upcoming Tours ({tours.length})
          </Typography>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {toursLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ color: 'var(--primary-color)', mb: 2 }} />
              <Typography variant="h6" color="var(--text-secondary)">
                Loading upcoming tours...
              </Typography>
            </Box>
          ) : toursError ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CancelIcon sx={{ fontSize: 60, color: 'var(--error-color)', mb: 2 }} />
              <Typography variant="h6" color="var(--error-color)" sx={{ mb: 1 }}>
                Error loading tours
              </Typography>
              <Typography variant="body2" color="var(--text-light)">
                {toursError}
              </Typography>
            </Box>
          ) : tours.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CalendarTodayIcon sx={{ fontSize: 60, color: 'var(--text-light)', mb: 2 }} />
              <Typography variant="h6" color="var(--text-secondary)" sx={{ mb: 1 }}>
                No upcoming tours
              </Typography>
              <Typography variant="body2" color="var(--text-light)">
                When buyers schedule tours of your properties, they will appear here.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {tours.map(tour => (
                <Grid item xs={12} md={6} key={tour.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-md)',
                      border: '1px solid var(--border-light)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 'var(--shadow-lg)',
                        borderColor: 'var(--border-accent)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          mb: 2
                        }}
                      >
                        {[tour.street, tour.city, tour.state, tour.zip].filter(Boolean).join(', ')}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <CalendarTodayIcon sx={{ fontSize: 20, color: 'var(--text-light)' }} />
                        <Typography variant="body2" color="var(--text-secondary)">
                          {formatDate(tour.scheduled_date)}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="var(--text-secondary)" sx={{ mb: 1 }}>
                        Time: {tour.scheduled_time}
                      </Typography>
                      
                      <Typography variant="body2" color="var(--text-secondary)" sx={{ mb: 2 }}>
                        Buyer ID: {tour.buyer_id}
                      </Typography>
                      
                      <Chip 
                        label={tour.status} 
                        color={getStatusColor(tour.status)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      
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
    </Container>
  );
};

export default SellerDashboard;