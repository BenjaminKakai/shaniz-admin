// =============================================================================
// SHANIZ GAMING ADMIN - TRANSACTIONS PAGE
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/api';
import type { Transaction } from '../types';

const transactionTypes = ['ALL', 'DEPOSIT', 'WITHDRAWAL', 'STAKE', 'WINNING', 'REFUND', 'TOURNAMENT_ENTRY', 'TOURNAMENT_PRIZE', 'ESCROW', 'PLATFORM_FEE'];
const statusOptions = ['ALL', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];

const Transactions: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Fetch transactions from API
  const { data: transactionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', page + 1, rowsPerPage, typeFilter, statusFilter, search],
    queryFn: () => transactionService.getAll(
      page + 1,
      rowsPerPage,
      typeFilter === 'ALL' ? undefined : typeFilter,
      statusFilter === 'ALL' ? undefined : statusFilter,
      search || undefined
    ),
  });

  // Approve transaction mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      transactionService.approve(id, notes),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Transaction approved successfully', severity: 'success' });
      setActionDialogOpen(false);
      setSelectedTransaction(null);
      setActionNotes('');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to approve transaction',
        severity: 'error',
      });
    },
  });

  // Reject transaction mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      transactionService.reject(id, reason),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Transaction rejected', severity: 'success' });
      setActionDialogOpen(false);
      setSelectedTransaction(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to reject transaction',
        severity: 'error',
      });
    },
  });

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Chip label="Completed" color="success" size="small" />;
      case 'PENDING':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'FAILED':
        return <Chip label="Failed" color="error" size="small" />;
      case 'CANCELLED':
        return <Chip label="Cancelled" color="default" size="small" />;
      case 'PROCESSING':
        return <Chip label="Processing" color="info" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getTypeChip = (type: string) => {
    const colors: Record<string, 'success' | 'error' | 'primary' | 'secondary' | 'info' | 'warning'> = {
      DEPOSIT: 'success',
      WITHDRAWAL: 'error',
      STAKE: 'primary',
      WINNING: 'success',
      REFUND: 'info',
      TOURNAMENT_ENTRY: 'secondary',
      TOURNAMENT_PRIZE: 'success',
      ESCROW: 'warning',
      PLATFORM_FEE: 'info',
    };
    return (
      <Chip
        label={type.replace(/_/g, ' ')}
        color={colors[type] || 'default'}
        size="small"
        variant="outlined"
      />
    );
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
  };

  const handleAction = (transaction: Transaction, type: 'approve' | 'reject') => {
    setSelectedTransaction(transaction);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedTransaction) return;

    if (actionType === 'approve') {
      approveMutation.mutate({ id: selectedTransaction.id, notes: actionNotes || undefined });
    } else if (actionType === 'reject') {
      if (!rejectReason) {
        setSnackbar({ open: true, message: 'Please provide a rejection reason', severity: 'error' });
        return;
      }
      rejectMutation.mutate({ id: selectedTransaction.id, reason: rejectReason });
    }
  };

  const transactions = transactionsData?.items || transactionsData || [];
  const totalTransactions = transactionsData?.total || transactions.length;

  // Calculate stats from current page data
  const pendingWithdrawals = transactions
    .filter((t: Transaction) => t.type === 'WITHDRAWAL' && t.status === 'PENDING')
    .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

  const todayDeposits = transactions
    .filter((t: Transaction) => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
    .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

  const pendingCount = transactions.filter((t: Transaction) => t.status === 'PENDING').length;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading transactions: {(error as any).message || 'Unknown error'}
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
          Transactions
        </Typography>
        <Box>
          <IconButton onClick={() => refetch()} title="Refresh" sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button variant="outlined" startIcon={<ExportIcon />}>
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="success.main">
                KES {todayDeposits.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deposits (Current Page)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                KES {pendingWithdrawals.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Withdrawals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>
                {pendingCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="primary">
                {totalTransactions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search by user, ID, or reference..."
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
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
            >
              {transactionTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type === 'ALL' ? 'All Types' : type.replace(/_/g, ' ')}
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
                  {status === 'ALL' ? 'All Status' : status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Transactions Table */}
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
                      <TableCell>Transaction ID</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="text.secondary" py={4}>
                            No transactions found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((txn: Transaction) => (
                        <TableRow key={txn.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {txn.id?.slice(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {txn.user?.username || txn.userId?.slice(0, 8) || 'Unknown'}
                            </Typography>
                          </TableCell>
                          <TableCell>{getTypeChip(txn.type)}</TableCell>
                          <TableCell>
                            <Typography
                              fontWeight={600}
                              color={
                                txn.type === 'WITHDRAWAL' || txn.type === 'STAKE' || txn.type === 'TOURNAMENT_ENTRY'
                                  ? 'error.main'
                                  : 'success.main'
                              }
                            >
                              {txn.type === 'WITHDRAWAL' || txn.type === 'STAKE' || txn.type === 'TOURNAMENT_ENTRY' ? '-' : '+'}
                              KES {(txn.amount || 0).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(txn.status)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {txn.reference || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {txn.createdAt ? new Date(txn.createdAt).toLocaleString() : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleViewTransaction(txn)}
                              title="View Details"
                            >
                              <ViewIcon />
                            </IconButton>
                            {txn.status === 'PENDING' && txn.type === 'WITHDRAWAL' && (
                              <>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleAction(txn, 'approve')}
                                  title="Approve"
                                >
                                  <ApproveIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleAction(txn, 'reject')}
                                  title="Reject"
                                >
                                  <RejectIcon />
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
                count={totalTransactions}
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

      {/* View Transaction Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                  <Typography variant="body2" fontFamily="monospace">{selectedTransaction.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box>{getStatusChip(selectedTransaction.status)}</Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Box>{getTypeChip(selectedTransaction.type)}</Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Amount</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    KES {(selectedTransaction.amount || 0).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">User</Typography>
                  <Typography variant="body2">
                    {selectedTransaction.user?.username || selectedTransaction.userId || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Reference</Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedTransaction.reference || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Created At</Typography>
                  <Typography variant="body2">
                    {selectedTransaction.createdAt
                      ? new Date(selectedTransaction.createdAt).toLocaleString()
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Completed At</Typography>
                  <Typography variant="body2">
                    {selectedTransaction.completedAt
                      ? new Date(selectedTransaction.completedAt).toLocaleString()
                      : '-'}
                  </Typography>
                </Grid>

                {selectedTransaction.metadata && (
                  <>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Metadata</Typography>
                      <Box sx={{
                        mt: 1,
                        p: 1,
                        bgcolor: 'grey.900',
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: 'auto'
                      }}>
                        <Typography variant="body2" fontFamily="monospace" fontSize={11}>
                          {JSON.stringify(selectedTransaction.metadata, null, 2)}
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

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Are you sure you want to {actionType} this withdrawal?
          </Typography>
          {selectedTransaction && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.900', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Amount:</strong> KES {(selectedTransaction.amount || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>User:</strong> {selectedTransaction.user?.username || selectedTransaction.userId}
              </Typography>
              <Typography variant="body2">
                <strong>Reference:</strong> {selectedTransaction.reference || '-'}
              </Typography>
            </Box>
          )}
          {actionType === 'approve' ? (
            <TextField
              fullWidth
              label="Notes (Optional)"
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              multiline
              rows={2}
            />
          ) : (
            <TextField
              fullWidth
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              multiline
              rows={2}
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setActionDialogOpen(false);
            setActionNotes('');
            setRejectReason('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            {approveMutation.isPending || rejectMutation.isPending
              ? 'Processing...'
              : actionType === 'approve'
              ? 'Approve'
              : 'Reject'}
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

export default Transactions;
