// =============================================================================
// SHANIZ GAMING ADMIN - ANTI-CHEAT PAGE
// =============================================================================

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  FormControlLabel,
  Checkbox,
  LinearProgress,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Check as ReviewIcon,
  Gavel as BanIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { antiCheatService } from '../services/api';
import type { AntiCheatEvent, AntiCheatSeverity } from '../types';

const severityColors: Record<AntiCheatSeverity, 'default' | 'warning' | 'error' | 'info'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'error',
};

const AntiCheat: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [reviewedFilter, setReviewedFilter] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<AntiCheatEvent | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [action, setAction] = useState('');
  const [banUser, setBanUser] = useState(false);
  const [banDuration, setBanDuration] = useState<number | ''>('');

  // Fetch anti-cheat events
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['anticheat', page, rowsPerPage, severityFilter, reviewedFilter],
    queryFn: () => antiCheatService.getAll(
      page + 1,
      rowsPerPage,
      severityFilter || undefined,
      reviewedFilter === '' ? undefined : reviewedFilter === 'true'
    ),
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: (params: { id: string; action: string; banUser?: boolean; banDuration?: number }) =>
      antiCheatService.review(params.id, params.action, params.banUser, params.banDuration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anticheat'] });
      handleCloseReviewDialog();
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, acEvent: AntiCheatEvent) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(acEvent);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenReviewDialog = () => {
    setReviewDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setAction('');
    setBanUser(false);
    setBanDuration('');
    setSelectedEvent(null);
  };

  const handleSubmitReview = () => {
    if (!selectedEvent || !action) return;

    reviewMutation.mutate({
      id: selectedEvent.id,
      action,
      banUser,
      banDuration: banDuration ? Number(banDuration) : undefined,
    });
  };

  const events = data?.events || data?.items || [];
  const pagination = data?.pagination || { total: 0 };

  if (error) {
    return (
      <Box>
        <Alert severity="error">Failed to load anti-cheat events. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h4">Anti-Cheat Events</Typography>
        </Box>
        <IconButton onClick={() => refetch()}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Severity"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Review Status</InputLabel>
                <Select
                  value={reviewedFilter}
                  onChange={(e) => {
                    setReviewedFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Review Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="false">Pending Review</MenuItem>
                  <MenuItem value="true">Reviewed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Event Type</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    No anti-cheat events found
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event: AntiCheatEvent) => (
                  <TableRow key={event.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {event.id.slice(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>{event.user?.username || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip label={event.eventType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={event.riskScore * 100}
                          color={event.riskScore > 0.7 ? 'error' : event.riskScore > 0.4 ? 'warning' : 'success'}
                          sx={{ width: 60, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="body2">
                          {(event.riskScore * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.severity}
                        size="small"
                        color={severityColors[event.severity]}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.isReviewed ? 'Reviewed' : 'Pending'}
                        size="small"
                        color={event.isReviewed ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(event.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, event)}
                        disabled={event.isReviewed}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={pagination.total || 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenReviewDialog}>
          <ListItemIcon>
            <ReviewIcon fontSize="small" color="primary" />
          </ListItemIcon>
          Review Event
        </MenuItem>
        <MenuItem onClick={() => {
          setBanUser(true);
          handleOpenReviewDialog();
        }}>
          <ListItemIcon>
            <BanIcon fontSize="small" color="error" />
          </ListItemIcon>
          Review & Ban User
        </MenuItem>
      </Menu>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Review Anti-Cheat Event
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity={severityColors[selectedEvent.severity] === 'error' ? 'error' : 'warning'}>
                <Typography variant="subtitle2">
                  {selectedEvent.eventType} - Risk Score: {(selectedEvent.riskScore * 100).toFixed(0)}%
                </Typography>
                <Typography variant="body2">{selectedEvent.reason}</Typography>
              </Alert>
              <TextField
                label="Action Taken"
                multiline
                rows={3}
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Describe the action taken (e.g., Warning issued, Account flagged, etc.)..."
                fullWidth
                required
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={banUser}
                    onChange={(e) => setBanUser(e.target.checked)}
                  />
                }
                label="Ban the user"
              />
              {banUser && (
                <TextField
                  label="Ban Duration (seconds)"
                  type="number"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Leave empty for permanent ban"
                  fullWidth
                  helperText="86400 = 1 day, 604800 = 1 week"
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            color={banUser ? 'error' : 'primary'}
            disabled={!action || reviewMutation.isPending}
          >
            {reviewMutation.isPending ? 'Submitting...' : banUser ? 'Review & Ban' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AntiCheat;
