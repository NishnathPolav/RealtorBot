import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const loggedInUser = await login(email, password);
      // Navigate directly based on role
      if (loggedInUser?.role === 'seller') {
        navigate('/seller-dashboard');
      } else {
        navigate('/buyer-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--background-secondary) 0%, var(--background-tertiary) 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={24}
          sx={{ 
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))'
            }
          }}
        >
          {/* Header */}
          <Box 
            sx={{ 
              background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
              color: 'white',
              textAlign: 'center',
              py: 4,
              px: 3
            }}
          >
            <Box 
              sx={{ 
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <LockOutlinedIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                mb: 1
              }}
            >
              Welcome Back
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.9,
                fontWeight: 300
              }}
            >
              Sign in to your RealtorBot account
            </Typography>
          </Box>

          {/* Form */}
          <Box sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
                required
                disabled={loading}
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
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-secondary)',
                    '&.Mui-focused': {
                      color: 'var(--primary-color)',
                    },
                  },
                }}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                required
                disabled={loading}
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
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-secondary)',
                    '&.Mui-focused': {
                      color: 'var(--primary-color)',
                    },
                  },
                }}
              />
              
              {error && (
                <Box 
                  sx={{ 
                    mt: 2,
                    p: 2,
                    bgcolor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--error-color)',
                    textAlign: 'center',
                    fontSize: '0.875rem'
                  }}
                >
                  {error}
                </Box>
              )}
              
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                disabled={loading}
                sx={{ 
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                  boxShadow: 'var(--shadow-md)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, var(--primary-dark), var(--primary-color))',
                    transform: 'translateY(-2px)',
                    boxShadow: 'var(--shadow-lg)',
                  },
                  '&:disabled': {
                    background: 'var(--text-light)',
                    transform: 'none',
                    boxShadow: 'none',
                  }
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                    Signing In...
                  </Box>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'var(--text-secondary)',
                  mb: 1
                }}
              >
                Don't have an account?
              </Typography>
              <Button 
                variant="text" 
                onClick={() => navigate('/signup')}
                sx={{ 
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--primary-color)',
                  '&:hover': {
                    background: 'rgba(37, 99, 235, 0.1)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                Create an account
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;