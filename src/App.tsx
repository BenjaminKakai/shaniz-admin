// =============================================================================
// SHANIZ GAMING ADMIN - MAIN APP
// =============================================================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Games from './pages/Games';
import Tournaments from './pages/Tournaments';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import AntiCheat from './pages/AntiCheat';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

// Shaniz App Colors - Matching Mobile App Theme
const AppColors = {
  // Primary colors - Neutral dark gray theme
  primary: '#374151',       // Gray 700
  primaryDark: '#1F2937',   // Gray 800
  primaryLight: '#4B5563',  // Gray 600

  // Secondary colors
  secondary: '#6B7280',     // Gray 500
  accent: '#9CA3AF',        // Gray 400

  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Background colors - Pure dark theme
  background: '#0A0A0A',    // Near black
  backgroundLight: '#121212', // Dark gray
  surface: '#1A1A1A',       // Card surface
  surfaceLight: '#262626',  // Elevated surface

  // Text colors
  textPrimary: '#F5F5F5',   // Near white
  textSecondary: '#A3A3A3', // Gray 400
  textMuted: '#737373',     // Gray 500

  // Game-specific colors
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

// Create theme - Dark theme matching mobile app
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: AppColors.primary,
      light: AppColors.primaryLight,
      dark: AppColors.primaryDark,
    },
    secondary: {
      main: AppColors.secondary,
      light: AppColors.accent,
    },
    success: {
      main: AppColors.success,
      light: '#4ade80',
    },
    warning: {
      main: AppColors.warning,
      light: '#fbbf24',
    },
    error: {
      main: AppColors.error,
      light: '#f87171',
    },
    info: {
      main: AppColors.info,
      light: '#60a5fa',
    },
    background: {
      default: AppColors.background,
      paper: AppColors.surface,
    },
    text: {
      primary: AppColors.textPrimary,
      secondary: AppColors.textSecondary,
    },
    divider: '#2D2D2D',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: AppColors.textPrimary,
    },
    h5: {
      fontWeight: 600,
      color: AppColors.textPrimary,
    },
    h6: {
      fontWeight: 600,
      color: AppColors.textPrimary,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: AppColors.background,
          color: AppColors.textPrimary,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: AppColors.surface,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          borderRadius: 16,
          border: `1px solid ${AppColors.surfaceLight}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: AppColors.surface,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
        },
        contained: {
          backgroundColor: AppColors.primary,
          '&:hover': {
            backgroundColor: AppColors.primaryLight,
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: AppColors.surfaceLight,
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: AppColors.textPrimary,
            borderBottom: `1px solid ${AppColors.surfaceLight}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${AppColors.surfaceLight}`,
          color: AppColors.textSecondary,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: `${AppColors.surfaceLight} !important`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: AppColors.surfaceLight,
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: AppColors.primary,
            },
            '&.Mui-focused fieldset': {
              borderColor: AppColors.primary,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: AppColors.surfaceLight,
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: AppColors.surface,
          borderRadius: 16,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: AppColors.surface,
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: AppColors.backgroundLight,
          boxShadow: 'none',
          borderBottom: `1px solid ${AppColors.surfaceLight}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: AppColors.backgroundLight,
          borderRight: `1px solid ${AppColors.surfaceLight}`,
        },
      },
    },
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('admin_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Placeholder pages
const Leaderboard = () => (
  <div>
    <h1>Leaderboard</h1>
    <p>Leaderboard page coming soon...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="games" element={<Games />} />
                <Route path="tournaments" element={<Tournaments />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="reports" element={<Reports />} />
                <Route path="anticheat" element={<AntiCheat />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
