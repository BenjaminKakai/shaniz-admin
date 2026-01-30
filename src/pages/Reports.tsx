// =============================================================================
// SHANIZ GAMING ADMIN - REPORTS PAGE
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
  TextField,
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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Check as ResolveIcon,
  Close as DismissIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/api';
import type { Report, ReportStatus } from '../types';

const statusColors: Record<ReportStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  PENDING: 'warning',
  UNDER_REVIEW: 'info',
  RESOLVED: 'success',
  DISMISSED: 'default',
};

const typeLabels: Record<string, string> = {
  CHEATING: 'Cheating',
  HARASSMENT: 'Harassment',
  ABUSE: 'Abuse',
  DISCONNECTION_ABUSE: 'Disconnect Abuse',
  OTHER: 'Other',
};

const Reports: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [newStatus, setNewStatus] = useState<string>('RESOLVED');
  const [banUser, setBanUser] = useState(false);
  const [banDuration, setBanDuration] = useState<number | ''>('');

  // Fetch reports
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', page, rowsPerPage, statusFilter],
    queryFn: () => reportService.getAll(page + 1, rowsPerPage, statusFilter || undefined),
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: (params: { id: string; status: string; resolution: string; banUser?: boolean; banDuration?: number }) =>
      reportService.review(params.id, params.status, params.resolution, params.banUser, params.banDuration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      handleCloseReviewDialog();
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, report: Report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenReviewDialog = (status: string) => {
    setNewStatus(status);
    setReviewDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setResolution('');
    setBanUser(false);
    setBanDuration('');
    setSelectedReport(null);
  };

  const handleSubmitReview = () => {
    if (!selectedReport || !resolution) return;

    reviewMutation.mutate({
      id: selectedReport.id,
      status: newStatus,
      resolution,
      banUser: banUser,
      banDuration: banDuration ? Number(banDuration) : undefined,
    });
  };

  const reports = data?.reports || data?.items || [];
  const pagination = data?.pagination || { total: 0 };

  if (error) {
    return (
      <Box>
        <Alert severity="error">Failed to load reports. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reports</Typography>
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                  <MenuItem value="RESOLVED">Resolved</MenuItem>
                  <MenuItem value="DISMISSED">Dismissed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Report ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Reporter</TableCell>
                <TableCell>Reported User</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report: Report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {report.id.slice(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={typeLabels[report.type] || report.type}
                        size="small"
                        color={report.type === 'CHEATING' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{report.reporter?.username || 'Unknown'}</TableCell>
                    <TableCell>{report.reportedUser?.username || 'Unknown'}</TableCell>
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
                        {report.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        size="small"
                        color={statusColors[report.status]}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, report)}
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
        <MenuItem onClick={() => handleOpenReviewDialog('UNDER_REVIEW')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          Mark Under Review
        </MenuItem>
        <MenuItem onClick={() => handleOpenReviewDialog('RESOLVED')}>
          <ListItemIcon>
            <ResolveIcon fontSize="small" color="success" />
          </ListItemIcon>
          Resolve
        </MenuItem>
        <MenuItem onClick={() => handleOpenReviewDialog('DISMISSED')}>
          <ListItemIcon>
            <DismissIcon fontSize="small" />
          </ListItemIcon>
          Dismiss
        </MenuItem>
      </Menu>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Review Report
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Resolution"
              multiline
              rows={3}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe the resolution or action taken..."
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
                <MenuItem value="DISMISSED">Dismissed</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={banUser}
                  onChange={(e) => setBanUser(e.target.checked)}
                />
              }
              label="Ban the reported user"
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={!resolution || reviewMutation.isPending}
          >
            {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
