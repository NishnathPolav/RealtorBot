import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import HomeIcon from '@mui/icons-material/Home';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const drawerWidth = 240;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleHomeClick = () => {
    if (user) {
      // Navigate to appropriate dashboard based on user role
      if (user.role === 'seller') {
        navigate('/seller-dashboard');
      } else {
        navigate('/buyer-dashboard');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'var(--background-primary)',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-sm)',
        borderBottom: '1px solid var(--border-light)',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Logo and Brand - Adjusted for sidebar */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            flexGrow: 1,
            '&:hover': {
              transform: 'scale(1.02)',
              transition: 'transform 0.2s ease'
            }
          }}
          onClick={handleHomeClick}
        >
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              mr: 2,
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <HomeIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.2
              }}
            >
              RealtorBot
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'var(--text-secondary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <SmartToyIcon sx={{ fontSize: 14 }} />
              AI-Powered Real Estate
            </Typography>
          </Box>
        </Box>

        {/* Navigation and Actions */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              color="inherit" 
              onClick={handleHomeClick}
              sx={{ 
                color: 'var(--text-secondary)',
                fontWeight: 500,
                '&:hover': {
                  color: 'var(--primary-color)',
                  background: 'var(--background-accent)',
                }
              }}
            >
              Dashboard
            </Button>
            <Button 
              variant="outlined"
              onClick={handleLogout}
              sx={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                borderRadius: 'var(--radius-md)',
                '&:hover': {
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  background: 'var(--background-accent)',
                }
              }}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;