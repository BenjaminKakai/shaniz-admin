// =============================================================================
// SHANIZ GAMING ADMIN - TOURNAMENTS PAGE
// =============================================================================

import React, { useState } from 'react';
import {
  Box,
  Grid,
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
  Chip,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentService } from '../services/api';
import type { Tournament, GameType } from '../types';

const statusOptions = ['ALL', 'DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const Tournaments: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundEntries, setRefundEntries] = useState(true);

  const [newTournament, setNewTournament] = useState({
    name: '',
    gameType: 'POOL' as GameType,
    entryFee: 500,
    maxParticipants: 32,
    prizePool: 10000,
    startDate: '',
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Fetch tournaments from API
  const { data: tournamentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['tournaments', page + 1, rowsPerPage, statusFilter],
    queryFn: () => tournamentService.getAll(
      page + 1,
      rowsPerPage,
      statusFilter === 'ALL' ? undefined : statusFilter
    ),
  });

  // Create tournament mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Tournament>) => tournamentService.create(data),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Tournament created successfully', severity: 'success' });
      setCreateDialogOpen(false);
      setNewTournament({
        name: '',
        gameType: 'POOL',
        entryFee: 500,
        maxParticipants: 32,
        prizePool: 10000,
        startDate: '',
      });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create tournament',
        severity: 'error',
      });
    },
  });

  // Start tournament mutation
  const startMutation = useMutation({
    mutationFn: (id: string) => tournamentService.start(id),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Tournament started', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to start tournament',
        severity: 'error',
      });
    },
  });

  // Complete tournament mutation
  const completeMutation = useMutation({
    mutationFn: (id: string) => tournamentService.complete(id),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Tournament completed', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to complete tournament',
        severity: 'error',
      });
    },
  });

  // Cancel tournament mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason, refund }: { id: string; reason: string; refund: boolean }) =>
      tournamentService.cancel(id, reason, refund),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Tournament cancelled', severity: 'success' });
      setCancelDialogOpen(false);
      setCancelReason('');
      setSelectedTournament(null);
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to cancel tournament',
        severity: 'error',
      });
    },
  });

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Chip label="Open" color="success" size="small" />;
      case 'IN_PROGRESS':
        return <Chip label="In Progress" color="primary" size="small" />;
      case 'DRAFT':
        return <Chip label="Draft" color="default" size="small" />;
      case 'COMPLETED':
        return <Chip label="Completed" color="info" size="small" />;
      case 'CANCELLED':
        return <Chip label="Cancelled" color="error" size="small" />;
      case 'REGISTRATION':
        return <Chip label="Registration" color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getGameTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      POOL: '8-Ball Pool',
      MINI_GOLF: 'Mini Golf',
      UNO_FLIP: 'UNO Flip',
      SIMPLE_CARDS: 'Cards',
      WORD: 'Word Game',
      WORD_HUNT: 'Word Hunt',
      ANAGRAMS: 'Anagrams',
    };
    return labels[type] || type;
  };

  const handleCreateTournament = () => {
    if (!newTournament.name || !newTournament.startDate) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }
    createMutation.mutate({
      name: newTournament.name,
      gameType: newTournament.gameType,
      entryFee: newTournament.entryFee,
      maxParticipants: newTournament.maxParticipants,
      prizePool: newTournament.prizePool,
      startDate: new Date(newTournament.startDate).toISOString(),
    });
  };

  const handleViewTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setViewDialogOpen(true);
  };

  const handleCancelClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (selectedTournament && cancelReason) {
      cancelMutation.mutate({
        id: selectedTournament.id,
        reason: cancelReason,
        refund: refundEntries,
      });
    }
  };

  const tournaments = tournamentsData?.items || tournamentsData || [];
  const totalTournaments = tournamentsData?.total || tournaments.length;

  // Calculate stats
  const openCount = tournaments.filter((t: Tournament) => t.status === 'OPEN' || t.status === 'REGISTRATION').length;
  const inProgressCount = tournaments.filter((t: Tournament) => t.status === 'IN_PROGRESS').length;
  const totalParticipants = tournaments.reduce((sum: number, t: Tournament) => sum + (t.currentParticipants || 0), 0);
  const totalPrizePool = tournaments.reduce((sum: number, t: Tournament) => sum + (t.prizePool || 0), 0);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading tournaments: {(error as any).message || 'Unknown error'}
        </Typography>
        <Button onClick={() => refetch()} startIcon={<RefreshIcon />} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Tournaments
        </Typography>
        <Box>
          <IconButton onClick={() => refetch()} title="Refresh" sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Tournament
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="primary">
                {openCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Open Tournaments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {inProgressCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>
                {totalParticipants}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Participants
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                KES {totalPrizePool.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Prize Pool
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            label="Status Filter"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {status === 'ALL' ? 'All Status' : status.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Tournaments Table */}
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
                      <TableCell>Tournament</TableCell>
                      <TableCell>Game Type</TableCell>
                      <TableCell>Entry Fee</TableCell>
                      <TableCell>Prize Pool</TableCell>
                      <TableCell>Participants</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tournaments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="text.secondary" py={4}>
                            No tournaments found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tournaments.map((tournament: Tournament) => (
                        <TableRow key={tournament.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {tournament.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                              {tournament.id?.slice(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getGameTypeLabel(tournament.gameType)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            KES {(tournament.entryFee || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight={500} color="success.main">
                              KES {(tournament.prizePool || 0).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {tournament.currentParticipants || 0} / {tournament.maxParticipants || 0}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={
                                  tournament.maxParticipants
                                    ? ((tournament.currentParticipants || 0) / tournament.maxParticipants) * 100
                                    : 0
                                }
                                sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{getStatusChip(tournament.status)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {tournament.startDate
                                ? new Date(tournament.startDate).toLocaleDateString()
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleViewTournament(tournament)}
                              title="View Details"
                            >
                              <ViewIcon />
                            </IconButton>
                            {tournament.status === 'DRAFT' && (
                              <IconButton
                                size="small"
                                onClick={() => console.log('Edit:', tournament.id)}
                                title="Edit"
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                            {(tournament.status === 'OPEN' || tournament.status === 'REGISTRATION') && (
                              <>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => startMutation.mutate(tournament.id)}
                                  title="Start Tournament"
                                  disabled={startMutation.isPending}
                                >
                                  <StartIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelClick(tournament)}
                                  title="Cancel Tournament"
                                >
                                  <CancelIcon />
                                </IconButton>
                              </>
                            )}
                            {tournament.status === 'IN_PROGRESS' && (
                              <>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => completeMutation.mutate(tournament.id)}
                                  title="Complete Tournament"
                                  disabled={completeMutation.isPending}
                                >
                                  <CompleteIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelClick(tournament)}
                                  title="Cancel Tournament"
                                >
                                  <StopIcon />
                                </IconButton>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={totalTournaments}
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

      {/* View Tournament Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tournament Details</DialogTitle>
        <DialogContent>
          {selectedTournament && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600}>{selectedTournament.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Tournament ID</Typography>
                  <Typography variant="body2" fontFamily="monospace">{selectedTournament.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box>{getStatusChip(selectedTournament.status)}</Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Game Type</Typography>
                  <Typography variant="body2">{getGameTypeLabel(selectedTournament.gameType)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Entry Fee</Typography>
                  <Typography variant="body2">KES {(selectedTournament.entryFee || 0).toLocaleString()}</Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Prize Pool</Typography>
                  <Typography variant="body2" color="success.main" fontWeight={600}>
                    KES {(selectedTournament.prizePool || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Participants</Typography>
                  <Typography variant="body2">
                    {selectedTournament.currentParticipants || 0} / {selectedTournament.maxParticipants || 0}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Start Date</Typography>
                  <Typography variant="body2">
                    {selectedTournament.startDate
                      ? new Date(selectedTournament.startDate).toLocaleString()
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">End Date</Typography>
                  <Typography variant="body2">
                    {selectedTournament.endDate
                      ? new Date(selectedTournament.endDate).toLocaleString()
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Created At</Typography>
                  <Typography variant="body2">
                    {selectedTournament.createdAt
                      ? new Date(selectedTournament.createdAt).toLocaleString()
                      : '-'}
                  </Typography>
                </Grid>

                {selectedTournament.winnerId && (
                  <>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Winner</Typography>
                      <Typography variant="body2" color="warning.main" fontWeight={600}>
                        {selectedTournament.winner?.username || selectedTournament.winnerId}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Tournament Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Tournament</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Are you sure you want to cancel this tournament? This action cannot be undone.
          </Typography>
          {selectedTournament && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.900', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Tournament:</strong> {selectedTournament.name}
              </Typography>
              <Typography variant="body2">
                <strong>Participants:</strong> {selectedTournament.currentParticipants || 0}
              </Typography>
              <Typography variant="body2">
                <strong>Prize Pool:</strong> KES {(selectedTournament.prizePool || 0).toLocaleString()}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            multiline
            rows={2}
            required
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Refund Entry Fees</InputLabel>
            <Select
              value={refundEntries ? 'yes' : 'no'}
              label="Refund Entry Fees"
              onChange={(e) => setRefundEntries(e.target.value === 'yes')}
            >
              <MenuItem value="yes">Yes - Refund all entry fees</MenuItem>
              <MenuItem value="no">No - Do not refund</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCancelConfirm}
            color="error"
            variant="contained"
            disabled={!cancelReason || cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Tournament'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Tournament Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Tournament</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tournament Name"
                value={newTournament.name}
                onChange={(e) =>
                  setNewTournament({ ...newTournament, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Game Type</InputLabel>
                <Select
                  value={newTournament.gameType}
                  label="Game Type"
                  onChange={(e) =>
                    setNewTournament({ ...newTournament, gameType: e.target.value as GameType })
                  }
                >
                  <MenuItem value="POOL">8-Ball Pool</MenuItem>
                  <MenuItem value="MINI_GOLF">Mini Golf</MenuItem>
                  <MenuItem value="UNO_FLIP">UNO Flip</MenuItem>
                  <MenuItem value="SIMPLE_CARDS">Cards</MenuItem>
                  <MenuItem value="WORD_HUNT">Word Hunt</MenuItem>
                  <MenuItem value="ANAGRAMS">Anagrams</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Participants"
                value={newTournament.maxParticipants}
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    maxParticipants: parseInt(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Entry Fee (KES)"
                value={newTournament.entryFee}
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    entryFee: parseInt(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Prize Pool (KES)"
                value={newTournament.prizePool}
                onChange={(e) =>
                  setNewTournament({
                    ...newTournament,
                    prizePool: parseInt(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={newTournament.startDate}
                onChange={(e) =>
                  setNewTournament({ ...newTournament, startDate: e.target.value })
                }
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateTournament}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Tournament'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Tournaments;
