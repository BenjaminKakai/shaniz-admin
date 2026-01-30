// =============================================================================
// SHANIZ GAMING ADMIN - AUDIT LOGS PAGE
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Gavel as GavelIcon,
  Block as BlockIcon,
  Settings as SettingsIcon,
  SportsEsports as GameIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '../services/api';
import type { AdminAction } from '../types';

const actionIcons: Record<string, React.ReactNode> = {
  BAN_USER: <BlockIcon color="error" fontSize="small" />,
  UNBAN_USER: <BlockIcon color="success" fontSize="small" />,
  SUSPEND_USER: <BlockIcon color="warning" fontSize="small" />,
  UNSUSPEND_USER: <BlockIcon color="success" fontSize="small" />,
  UPDATE_ROLE: <PersonIcon color="primary" fontSize="small" />,
  FORCE_END_SESSION: <GameIcon color="warning" fontSize="small" />,
  REVIEW_REPORT: <GavelIcon color="primary" fontSize="small" />,
  REVIEW_ANTICHEAT: <GavelIcon color="warning" fontSize="small" />,
  UPDATE_GAME_CONFIG: <SettingsIcon color="info" fontSize="small" />,
  UPDATE_SYSTEM_CONFIG: <SettingsIcon color="info" fontSize="small" />,
  APPROVE_TRANSACTION: <GavelIcon color="success" fontSize="small" />,
  REJECT_TRANSACTION: <GavelIcon color="error" fontSize="small" />,
  CANCEL_TOURNAMENT: <GameIcon color="error" fontSize="small" />,
  COMPLETE_TOURNAMENT: <GameIcon color="success" fontSize="small" />,
  CREATE_ANNOUNCEMENT: <SettingsIcon color="primary" fontSize="small" />,
};

const actionLabels: Record<string, string> = {
  BAN_USER: 'Ban User',
  UNBAN_USER: 'Unban User',
  SUSPEND_USER: 'Suspend User',
  UNSUSPEND_USER: 'Unsuspend User',
  UPDATE_ROLE: 'Update Role',
  FORCE_END_SESSION: 'Force End Session',
  REVIEW_REPORT: 'Review Report',
  REVIEW_ANTICHEAT: 'Review Anti-Cheat',
  UPDATE_GAME_CONFIG: 'Update Game Config',
  UPDATE_SYSTEM_CONFIG: 'Update System Config',
  APPROVE_TRANSACTION: 'Approve Transaction',
  REJECT_TRANSACTION: 'Reject Transaction',
  CANCEL_TOURNAMENT: 'Cancel Tournament',
  COMPLETE_TOURNAMENT: 'Complete Tournament',
  CREATE_ANNOUNCEMENT: 'Create Announcement',
};

const AuditLogs: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [adminFilter, setAdminFilter] = useState<string>('');

  // Fetch audit logs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auditLogs', page, rowsPerPage, adminFilter, actionFilter],
    queryFn: () => auditService.getAll(
      page + 1,
      rowsPerPage,
      adminFilter || undefined,
      actionFilter || undefined
    ),
  });

  const actions = data?.actions || data?.items || [];
  const pagination = data?.pagination || { total: 0 };

  if (error) {
    return (
      <Box>
        <Alert severity="error">Failed to load audit logs. You may not have permission to view this page.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h4">Audit Logs</Typography>
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
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Action Type"
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="BAN_USER">Ban User</MenuItem>
                  <MenuItem value="UNBAN_USER">Unban User</MenuItem>
                  <MenuItem value="SUSPEND_USER">Suspend User</MenuItem>
                  <MenuItem value="UPDATE_ROLE">Update Role</MenuItem>
                  <MenuItem value="FORCE_END_SESSION">Force End Session</MenuItem>
                  <MenuItem value="REVIEW_REPORT">Review Report</MenuItem>
                  <MenuItem value="REVIEW_ANTICHEAT">Review Anti-Cheat</MenuItem>
                  <MenuItem value="APPROVE_TRANSACTION">Approve Transaction</MenuItem>
                  <MenuItem value="REJECT_TRANSACTION">Reject Transaction</MenuItem>
                  <MenuItem value="UPDATE_GAME_CONFIG">Update Game Config</MenuItem>
                  <MenuItem value="UPDATE_SYSTEM_CONFIG">Update System Config</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Filter by Admin ID"
                value={adminFilter}
                onChange={(e) => {
                  setAdminFilter(e.target.value);
                  setPage(0);
                }}
                placeholder="Enter admin ID..."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : actions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                actions.map((action: AdminAction) => (
                  <TableRow key={action.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(action.createdAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          {action.admin?.username || action.adminId.slice(0, 8)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {actionIcons[action.action] || <SettingsIcon fontSize="small" />}
                        <Chip
                          label={actionLabels[action.action] || action.action}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {action.entityType}
                        {action.entityId && (
                          <Tooltip title={action.entityId}>
                            <span> ({action.entityId.slice(0, 8)}...)</span>
                          </Tooltip>
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {action.target ? (
                        <Typography variant="body2">
                          {action.target.username}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
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
                        {action.reason || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {action.ipAddress || '-'}
                      </Typography>
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
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Card>
    </Box>
  );
};

export default AuditLogs;
