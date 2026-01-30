// =============================================================================
// SHANIZ GAMING ADMIN - USERS PAGE (Real Data)
// =============================================================================

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Warning as SuspendedIcon,
  Person as PersonIcon,
  SportsEsports as GamesIcon,
  EmojiEvents as WinsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/api';

interface User {
  id: string;
  externalUserId: string;
  username: string;
  email: string | null;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  createdAt: string;
  _count?: {
    sessionsAsPlayer1: number;
    sessionsAsPlayer2: number;
    antiCheatEvents: number;
    reportsReceived: number;
  };
}

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'suspend' | 'ban' | 'unsuspend' | 'unban' | null;
  }>({ open: false, type: null });
  const [actionReason, setActionReason] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch users from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page + 1, rowsPerPage, search],
    queryFn: () => userService.getAll(page + 1, rowsPerPage, search || undefined),
  });

  // Mutations for user actions
  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      userService.suspend(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({ open: true, message: 'User suspended successfully', severity: 'success' });
      setActionDialog({ open: false, type: null });
      setActionReason('');
    },
    onError: (err: any) => {
      setSnackbar({ open: true, message: err.message || 'Failed to suspend user', severity: 'error' });
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (userId: string) => userService.unsuspend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({ open: true, message: 'User unsuspended successfully', severity: 'success' });
      setActionDialog({ open: false, type: null });
    },
    onError: (err: any) => {
      setSnackbar({ open: true, message: err.message || 'Failed to unsuspend user', severity: 'error' });
    },
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      userService.ban(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({ open: true, message: 'User banned successfully', severity: 'success' });
      setActionDialog({ open: false, type: null });
      setActionReason('');
    },
    onError: (err: any) => {
      setSnackbar({ open: true, message: err.message || 'Failed to ban user', severity: 'error' });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => userService.unban(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({ open: true, message: 'User unbanned successfully', severity: 'success' });
      setActionDialog({ open: false, type: null });
    },
    onError: (err: any) => {
      setSnackbar({ open: true, message: err.message || 'Failed to unban user', severity: 'error' });
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleAction = (type: 'suspend' | 'ban' | 'unsuspend' | 'unban') => {
    setActionDialog({ open: true, type });
    handleMenuClose();
  };

  const handleConfirmAction = () => {
    if (!selectedUser) return;

    switch (actionDialog.type) {
      case 'suspend':
        suspendMutation.mutate({ userId: selectedUser.id, reason: actionReason });
        break;
      case 'unsuspend':
        unsuspendMutation.mutate(selectedUser.id);
        break;
      case 'ban':
        banMutation.mutate({ userId: selectedUser.id, reason: actionReason });
        break;
      case 'unban':
        unbanMutation.mutate(selectedUser.id);
        break;
    }
  };

  const getStatusChip = (user: User) => {
    if (user.isBanned) {
      return <Chip icon={<BlockIcon />} label="Banned" color="error" size="small" />;
    }
    if (!user.isActive) {
      return <Chip icon={<SuspendedIcon />} label="Suspended" color="warning" size="small" />;
    }
    return <Chip icon={<ActiveIcon />} label="Active" color="success" size="small" />;
  };

  const getActionMenuItems = (user: User) => {
    const items = [
      <MenuItem key="view" onClick={handleViewDetails}>
        View Details
      </MenuItem>,
    ];

    if (user.isBanned) {
      items.push(
        <MenuItem key="unban" onClick={() => handleAction('unban')} sx={{ color: 'success.main' }}>
          Unban User
        </MenuItem>
      );
    } else if (!user.isActive) {
      items.push(
        <MenuItem key="unsuspend" onClick={() => handleAction('unsuspend')} sx={{ color: 'success.main' }}>
          Unsuspend User
        </MenuItem>
      );
      items.push(
        <MenuItem key="ban" onClick={() => handleAction('ban')} sx={{ color: 'error.main' }}>
          Ban User
        </MenuItem>
      );
    } else {
      items.push(
        <MenuItem key="suspend" onClick={() => handleAction('suspend')} sx={{ color: 'warning.main' }}>
          Suspend User
        </MenuItem>
      );
      items.push(
        <MenuItem key="ban" onClick={() => handleAction('ban')} sx={{ color: 'error.main' }}>
          Ban User
        </MenuItem>
      );
    }

    return items;
  };

  const users: User[] = (data?.users || []) as User[];
  const totalUsers = data?.pagination?.total || 0;

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load users. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Users
        </Typography>
        <TextField
          placeholder="Search users..."
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Games Played</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Joined</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {user.username?.charAt(0).toUpperCase() || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {user.username}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.email || user.externalUserId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            color={user.role === 'SUPER_ADMIN' ? 'error' : user.role === 'ADMIN' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(user._count?.sessionsAsPlayer1 || 0) + (user._count?.sessionsAsPlayer2 || 0)} games
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(user)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, user)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" py={4}>
                            No users found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={totalUsers}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {selectedUser && getActionMenuItems(selectedUser)}
      </Menu>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          User Details
          <IconButton onClick={() => setDetailsOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
                    {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedUser.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedUser.email || 'No email'}
                    </Typography>
                    {getStatusChip(selectedUser)}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon color="action" />
                  <Typography variant="body2" color="text.secondary">User ID</Typography>
                </Box>
                <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>
                  {selectedUser.id}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon color="action" />
                  <Typography variant="body2" color="text.secondary">External ID</Typography>
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  {selectedUser.externalUserId}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <GamesIcon color="action" />
                  <Typography variant="body2" color="text.secondary">Games Played</Typography>
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  {(selectedUser._count?.sessionsAsPlayer1 || 0) + (selectedUser._count?.sessionsAsPlayer2 || 0)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WinsIcon color="action" />
                  <Typography variant="body2" color="text.secondary">Role</Typography>
                </Box>
                <Chip label={selectedUser.role} size="small" />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Anti-Cheat Events
                </Typography>
                <Typography variant="h6" fontWeight={700} color={selectedUser._count?.antiCheatEvents ? 'error.main' : 'text.primary'}>
                  {selectedUser._count?.antiCheatEvents || 0}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Reports Received
                </Typography>
                <Typography variant="h6" fontWeight={700} color={selectedUser._count?.reportsReceived ? 'warning.main' : 'text.primary'}>
                  {selectedUser._count?.reportsReceived || 0}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Joined
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </Typography>
              </Grid>

              {selectedUser.isBanned && selectedUser.banReason && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <strong>Ban Reason:</strong> {selectedUser.banReason}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={() => {
          setActionDialog({ open: false, type: null });
          setActionReason('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.type === 'suspend' && 'Suspend User'}
          {actionDialog.type === 'unsuspend' && 'Unsuspend User'}
          {actionDialog.type === 'ban' && 'Ban User'}
          {actionDialog.type === 'unban' && 'Unban User'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {actionDialog.type === 'suspend' && 'This will temporarily disable the user\'s account.'}
            {actionDialog.type === 'unsuspend' && 'This will reactivate the user\'s account.'}
            {actionDialog.type === 'ban' && 'This will permanently ban the user from the platform.'}
            {actionDialog.type === 'unban' && 'This will lift the ban and allow the user to access the platform.'}
          </Typography>

          {selectedUser && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>User:</strong> {selectedUser.username}
              </Typography>
              <Typography variant="body2">
                <strong>ID:</strong> {selectedUser.id}
              </Typography>
            </Box>
          )}

          {(actionDialog.type === 'suspend' || actionDialog.type === 'ban') && (
            <TextField
              fullWidth
              label="Reason"
              multiline
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Enter the reason for this action..."
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setActionDialog({ open: false, type: null });
              setActionReason('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={actionDialog.type === 'ban' ? 'error' : actionDialog.type === 'suspend' ? 'warning' : 'success'}
            variant="contained"
            disabled={
              (actionDialog.type === 'suspend' || actionDialog.type === 'ban') && !actionReason.trim()
            }
          >
            {actionDialog.type === 'suspend' && 'Suspend'}
            {actionDialog.type === 'unsuspend' && 'Unsuspend'}
            {actionDialog.type === 'ban' && 'Ban'}
            {actionDialog.type === 'unban' && 'Unban'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
