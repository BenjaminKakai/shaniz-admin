// =============================================================================
// SHANIZ GAMING ADMIN - DASHBOARD PAGE
// =============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  CardActionArea,
} from '@mui/material';
import {
  People as PeopleIcon,
  SportsEsports as GamesIcon,
  EmojiEvents as TournamentIcon,
  AccountBalance as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api';

// Sample data for charts (replace with real API data)
const revenueData = [
  { date: 'Mon', revenue: 4000 },
  { date: 'Tue', revenue: 3000 },
  { date: 'Wed', revenue: 5000 },
  { date: 'Thu', revenue: 2780 },
  { date: 'Fri', revenue: 1890 },
  { date: 'Sat', revenue: 2390 },
  { date: 'Sun', revenue: 3490 },
];

const gameStatsData = [
  { name: '8-Ball', games: 1200 },
  { name: 'Mini Golf', games: 890 },
  { name: 'UNO Flip', games: 650 },
  { name: 'Cards', games: 420 },
  { name: 'Word Hunt', games: 380 },
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change, onClick }) => {
  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            {change && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  {change}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Clickable Box component for overview sections
interface ClickableStatBoxProps {
  children: React.ReactNode;
  onClick?: () => void;
  sx?: object;
}

const ClickableStatBox: React.FC<ClickableStatBoxProps> = ({ children, onClick, sx = {} }) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'scale(1.02)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        } : {},
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getStats,
    // Use default data while loading or if API fails
    placeholderData: {
      totalUsers: 1234,
      activeUsers: 456,
      totalGames: 5678,
      gamesInProgress: 89,
      totalRevenue: 1250000,
      todayRevenue: 45000,
      totalTournaments: 23,
      activeTournaments: 5,
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers?.toLocaleString() || '0'}
            icon={<PeopleIcon />}
            color="#374151"
            change="+12% this week"
            onClick={() => navigate('/users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Games"
            value={stats?.gamesInProgress || '0'}
            icon={<PlayIcon />}
            color="#22C55E"
            onClick={() => navigate('/games')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Games"
            value={stats?.totalGames?.toLocaleString() || '0'}
            icon={<GamesIcon />}
            color="#3B82F6"
            change="+8% this week"
            onClick={() => navigate('/games')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Revenue"
            value={`KES ${(stats?.todayRevenue || 0).toLocaleString()}`}
            icon={<MoneyIcon />}
            color="#F59E0B"
            change="+15% vs yesterday"
            onClick={() => navigate('/transactions')}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={4}>
        {/* Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              },
            }}
            onClick={() => navigate('/transactions')}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Weekly Revenue
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`KES ${(value as number)?.toLocaleString()}`, 'Revenue']}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#374151"
                      strokeWidth={3}
                      dot={{ fill: '#374151' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tournament Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Tournament Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <ClickableStatBox
                  onClick={() => navigate('/tournaments')}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'primary.50',
                    border: '1px solid',
                    borderColor: 'primary.200',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TournamentIcon color="primary" />
                    <Typography variant="h5" fontWeight={700} color="primary">
                      {stats?.activeTournaments || 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Tournaments
                  </Typography>
                </ClickableStatBox>
                <ClickableStatBox
                  onClick={() => navigate('/tournaments')}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'grey.100',
                  }}
                >
                  <Typography variant="h5" fontWeight={700}>
                    {stats?.totalTournaments || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tournaments
                  </Typography>
                </ClickableStatBox>
                <ClickableStatBox
                  onClick={() => navigate('/transactions')}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'success.50',
                    border: '1px solid',
                    borderColor: 'success.200',
                  }}
                >
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    KES {(stats?.totalRevenue || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </ClickableStatBox>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Game Stats Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              },
            }}
            onClick={() => navigate('/games')}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Games by Type
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gameStatsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="games"
                      fill="#374151"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <ClickableStatBox
                    onClick={() => navigate('/users')}
                    sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.100' }}
                  >
                    <Typography variant="h4" fontWeight={700}>
                      {stats?.activeUsers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users (24h)
                    </Typography>
                  </ClickableStatBox>
                </Grid>
                <Grid item xs={6}>
                  <ClickableStatBox
                    onClick={() => navigate('/games')}
                    sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.100' }}
                  >
                    <Typography variant="h4" fontWeight={700}>
                      {((stats?.totalGames || 0) / (stats?.totalUsers || 1)).toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Games/User
                    </Typography>
                  </ClickableStatBox>
                </Grid>
                <Grid item xs={6}>
                  <ClickableStatBox
                    onClick={() => navigate('/transactions')}
                    sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.100' }}
                  >
                    <Typography variant="h4" fontWeight={700}>
                      KES {Math.round((stats?.todayRevenue || 0) / (stats?.gamesInProgress || 1)).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Stake
                    </Typography>
                  </ClickableStatBox>
                </Grid>
                <Grid item xs={6}>
                  <ClickableStatBox
                    onClick={() => navigate('/settings')}
                    sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.100' }}
                  >
                    <Typography variant="h4" fontWeight={700}>
                      98.5%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uptime
                    </Typography>
                  </ClickableStatBox>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
