// =============================================================================
// SHANIZ GAMING ADMIN - GAMES PAGE
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
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameService } from '../services/api';
import type { GameSession, GameType } from '../types';

const gameTypes: (GameType | 'ALL')[] = [
  'ALL',
  'POOL',
  'MINI_GOLF',
  'UNO_FLIP',
  'SIMPLE_CARDS',
  'WORD',
  'WORD_HUNT',
  'ANAGRAMS',
];

const statusOptions = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const Games: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState<GameType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameSession | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundPlayers, setRefundPlayers] = useState(true);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Fetch games from API
  const { data: gamesData, isLoading, error, refetch } = useQuery({
    queryKey: ['games', page + 1, rowsPerPage, gameTypeFilter, statusFilter, search],
    queryFn: () => gameService.getAll(
      page + 1,
      rowsPerPage,
      gameTypeFilter === 'ALL' ? undefined : gameTypeFilter,
      statusFilter === 'ALL' ? undefined : statusFilter,
      search || undefined
    ),
  });

  // Cancel game mutation
  const cancelGameMutation = useMutation({
    mutationFn: ({ id, reason, refund }: { id: string; reason: string; refund: boolean }) =>
      gameService.cancel(id, reason, refund),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Game cancelled successfully', severity: 'success' });
      setCancelDialogOpen(false);
      setCancelReason('');
      setSelectedGame(null);
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to cancel game',
        severity: 'error',
      });
    },
  });

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Chip label="In Progress" color="primary" size="small" />;
      case 'COMPLETED':
        return <Chip label="Completed" color="success" size="small" />;
      case 'PENDING':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'CANCELLED':
        return <Chip label="Cancelled" color="error" size="small" />;
      case 'WAITING':
        return <Chip label="Waiting" color="info" size="small" />;
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

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return '-';
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleViewGame = (game: GameSession) => {
    setSelectedGame(game);
    setViewDialogOpen(true);
  };

  const handleCancelClick = (game: GameSession) => {
    setSelectedGame(game);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (selectedGame && cancelReason) {
      cancelGameMutation.mutate({
        id: selectedGame.id,
        reason: cancelReason,
        refund: refundPlayers,
      });
    }
  };

  const games: GameSession[] = (gamesData?.items || gamesData?.sessions || (Array.isArray(gamesData) ? gamesData : [])) as GameSession[];
  const totalGames = gamesData?.total || gamesData?.pagination?.total || games.length;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading games: {(error as any).message || 'Unknown error'}
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
          Games
        </Typography>
        <IconButton onClick={() => refetch()} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search by player or game ID..."
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
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Game Type</InputLabel>
            <Select
              value={gameTypeFilter}
              label="Game Type"
              onChange={(e) => {
                setGameTypeFilter(e.target.value as GameType | 'ALL');
                setPage(0);
              }}
            >
              {gameTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type === 'ALL' ? 'All Games' : getGameTypeLabel(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
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
        </Grid>
      </Grid>

      {/* Games Table */}
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
                      <TableCell>Game ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Players</TableCell>
                      <TableCell>Stake</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {games.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="text.secondary" py={4}>
                            No games found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      games.map((game) => (
                        <TableRow key={game.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {game.id?.slice(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getGameTypeLabel(game.gameType)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {game.player1?.username || game.player1Id?.slice(0, 8) || 'Player 1'} vs{' '}
                              {game.player2?.username || game.player2Id?.slice(0, 8) || 'Waiting...'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight={500}>
                              KES {(game.stake || 0).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(game.status)}</TableCell>
                          <TableCell>{formatDuration(game.startedAt, game.endedAt)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {game.createdAt ? new Date(game.createdAt).toLocaleString() : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleViewGame(game)}
                              title="View Details"
                            >
                              <ViewIcon />
                            </IconButton>
                            {(game.status === 'IN_PROGRESS' || game.status === 'PENDING' || game.status === 'WAITING') && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancelClick(game)}
                                title="Cancel Game"
                              >
                                <CancelIcon />
                              </IconButton>
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
                count={totalGames}
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

      {/* View Game Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Game Details</DialogTitle>
        <DialogContent>
          {selectedGame && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Game ID</Typography>
                  <Typography variant="body2" fontFamily="monospace">{selectedGame.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Game Type</Typography>
                  <Typography variant="body2">{getGameTypeLabel(selectedGame.gameType)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box>{getStatusChip(selectedGame.status)}</Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Stake</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    KES {(selectedGame.stake || 0).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Player 1</Typography>
                  <Typography variant="body2">
                    {selectedGame.player1?.username || selectedGame.player1Id || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Player 2</Typography>
                  <Typography variant="body2">
                    {selectedGame.player2?.username || selectedGame.player2Id || 'Waiting...'}
                  </Typography>
                </Grid>

                {selectedGame.winnerId && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Winner</Typography>
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      {selectedGame.winner?.username || selectedGame.winnerId}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Created At</Typography>
                  <Typography variant="body2">
                    {selectedGame.createdAt ? new Date(selectedGame.createdAt).toLocaleString() : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Started At</Typography>
                  <Typography variant="body2">
                    {selectedGame.startedAt ? new Date(selectedGame.startedAt).toLocaleString() : '-'}
                  </Typography>
                </Grid>
                {selectedGame.endedAt && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Ended At</Typography>
                    <Typography variant="body2">
                      {new Date(selectedGame.endedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Duration</Typography>
                  <Typography variant="body2">
                    {formatDuration(selectedGame.startedAt, selectedGame.endedAt)}
                  </Typography>
                </Grid>

                {selectedGame.gameState && (
                  <>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Game State</Typography>
                      <Box sx={{
                        mt: 1,
                        p: 1,
                        bgcolor: 'grey.900',
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: 'auto'
                      }}>
                        <Typography variant="body2" fontFamily="monospace" fontSize={11}>
                          {JSON.stringify(selectedGame.gameState, null, 2)}
                        </Typography>
                      </Box>
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

      {/* Cancel Game Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Game</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Are you sure you want to cancel this game? This action cannot be undone.
          </Typography>
          {selectedGame && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.900', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Game:</strong> {selectedGame.id?.slice(0, 8)}...
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {getGameTypeLabel(selectedGame.gameType)}
              </Typography>
              <Typography variant="body2">
                <strong>Stake:</strong> KES {(selectedGame.stake || 0).toLocaleString()}
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
            <InputLabel>Refund Players</InputLabel>
            <Select
              value={refundPlayers ? 'yes' : 'no'}
              label="Refund Players"
              onChange={(e) => setRefundPlayers(e.target.value === 'yes')}
            >
              <MenuItem value="yes">Yes - Refund stakes to players</MenuItem>
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
            disabled={!cancelReason || cancelGameMutation.isPending}
          >
            {cancelGameMutation.isPending ? 'Cancelling...' : 'Cancel Game'}
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

export default Games;
