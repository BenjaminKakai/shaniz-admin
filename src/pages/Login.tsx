// =============================================================================
// SHANIZ GAMING ADMIN - LOGIN PAGE
// =============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // For demo: allow bypass with any credentials
  const handleDemoLogin = () => {
    localStorage.setItem('admin_token', 'demo_token_123');
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A0A',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', bgcolor: '#1A1A1A', border: '1px solid #262626' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Shaniz"
              sx={{
                width: 80,
                height: 80,
                borderRadius: 2,
                mb: 2,
              }}
              onError={(e: any) => {
                e.target.style.display = 'none';
              }}
            />
            <Typography variant="h5" fontWeight={700} sx={{ color: '#F5F5F5' }}>
              Shaniz Admin
            </Typography>
            <Typography variant="body2" sx={{ color: '#A3A3A3' }}>
              Gaming Platform Admin Dashboard
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#262626',
                  color: '#F5F5F5',
                  '& fieldset': { borderColor: '#374151' },
                  '&:hover fieldset': { borderColor: '#4B5563' },
                },
                '& .MuiInputLabel-root': { color: '#A3A3A3' },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#262626',
                  color: '#F5F5F5',
                  '& fieldset': { borderColor: '#374151' },
                  '&:hover fieldset': { borderColor: '#4B5563' },
                },
                '& .MuiInputLabel-root': { color: '#A3A3A3' },
              }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                bgcolor: '#374151',
                color: '#F5F5F5',
                '&:hover': { bgcolor: '#4B5563' },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#F5F5F5' }} /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#737373' }}>
              Demo Mode
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleDemoLogin}
              sx={{
                mt: 1,
                borderColor: '#374151',
                color: '#A3A3A3',
                '&:hover': {
                  borderColor: '#4B5563',
                  bgcolor: 'rgba(55, 65, 81, 0.1)',
                },
              }}
            >
              Enter Demo Dashboard
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
