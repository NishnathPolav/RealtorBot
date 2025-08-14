import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import SecurityIcon from '@mui/icons-material/Security';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: <SearchIcon sx={{ fontSize: 32, color: 'var(--primary-color)' }} />,
      title: 'Intelligent Property Search',
      description: 'Advanced AI algorithms understand your preferences and find properties that match your exact requirements.'
    },
    {
      icon: <ChatIcon sx={{ fontSize: 32, color: 'var(--secondary-color)' }} />,
      title: 'AI-Powered Assistant',
      description: 'Get personalized guidance from our intelligent real estate assistant available 24/7.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 32, color: 'var(--success-color)' }} />,
      title: 'Secure Platform',
      description: 'Enterprise-grade security ensures your data is protected throughout your real estate journey.'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: 'var(--background-primary)' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: 'var(--background-secondary)',
          borderBottom: '1px solid var(--border-light)',
          py: { xs: 6, md: 10 }
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto' }}>
            <Box sx={{ mb: 4 }}>
              <Box 
                sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  mb: 3,
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <SmartToyIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
            </Box>
            
            <Typography 
              variant="h2" 
              sx={{ 
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 700,
                mb: 3,
                color: 'var(--text-primary)',
                lineHeight: 1.2
              }}
            >
              Welcome to <span style={{ color: 'var(--primary-color)' }}>RealtorBot</span>
            </Typography>
            
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4,
                fontWeight: 400,
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}
            >
              Your AI-powered real estate platform for intelligent property discovery and management
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 6,
                color: 'var(--text-light)',
                fontSize: '1.125rem',
                lineHeight: 1.6,
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Experience the future of real estate with our intelligent AI assistant. 
              Get personalized property recommendations, market insights, and expert guidance 
              to make informed decisions about your next property investment.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSignUp}
                startIcon={<SmartToyIcon />}
                sx={{
                  bgcolor: 'var(--primary-color)',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)',
                  '&:hover': {
                    bgcolor: 'var(--primary-dark)',
                    transform: 'translateY(-1px)',
                    boxShadow: 'var(--shadow-lg)'
                  }
                }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleLogin}
                sx={{
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-lg)',
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: 'var(--primary-dark)',
                    bgcolor: 'var(--background-accent)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              mb: 3,
              color: 'var(--text-primary)',
              fontWeight: 600
            }}
          >
            Why Choose RealtorBot?
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.5
            }}
          >
            Discover how our AI technology transforms the real estate experience
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-light)',
                  transition: 'all 0.3s ease',
                  background: 'var(--background-primary)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 'var(--shadow-lg)',
                    borderColor: 'var(--border-accent)'
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2,
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* AI Assistant Preview */}
      <Box 
        sx={{ 
          bgcolor: 'var(--background-secondary)',
          py: { xs: 8, md: 10 },
          borderTop: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)'
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                mb: 3,
                color: 'var(--text-primary)',
                fontWeight: 600
              }}
            >
              Experience AI-Powered Real Estate
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 4,
                color: 'var(--text-secondary)',
                fontWeight: 400
              }}
            >
              Our intelligent assistant is ready to help you find your ideal property
            </Typography>
          </Box>
          
          <Card 
            sx={{ 
              p: 4, 
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)',
              background: 'var(--background-primary)',
              border: '1px solid var(--border-light)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box 
                sx={{ 
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <SmartToyIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                RealtorBot AI Assistant
              </Typography>
              <Box 
                sx={{
                  background: 'var(--primary-color)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                AI
              </Box>
            </Box>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                fontStyle: 'italic',
                p: 3,
                background: 'var(--background-tertiary)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--primary-color)'
              }}
            >
              "Hello! I'm your AI real estate assistant. I can help you find properties, 
              analyze market trends, and provide personalized recommendations. 
              What type of property are you looking for today?"
            </Typography>
          </Card>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box 
        sx={{ 
          bgcolor: 'var(--background-primary)',
          py: { xs: 8, md: 10 }
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              sx={{ 
                mb: 3,
                color: 'var(--text-primary)',
                fontWeight: 600
              }}
            >
              Ready to Get Started?
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 4,
                color: 'var(--text-secondary)',
                fontWeight: 400
              }}
            >
              Join thousands of users who are already using our platform to find their perfect properties
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleSignUp}
              startIcon={<SmartToyIcon />}
              sx={{
                bgcolor: 'var(--primary-color)',
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
                '&:hover': {
                  bgcolor: 'var(--primary-dark)',
                  transform: 'translateY(-1px)',
                  boxShadow: 'var(--shadow-lg)'
                }
              }}
            >
              Create Your Account
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;