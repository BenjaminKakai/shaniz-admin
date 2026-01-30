// =============================================================================
// SHANIZ GAMING ADMIN - SETTINGS PAGE
// =============================================================================

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Announcement as AnnouncementIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configService, announcementService } from '../services/api';

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Announcement state
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');
  const [broadcastToAll, setBroadcastToAll] = useState(true);

  // Config state
  const [editedConfigs, setEditedConfigs] = useState<Record<string, any>>({});

  // Fetch system config
  const { data: configData, isLoading, error, refetch } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: () => configService.getAll(),
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) => configService.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
      setSnackbar({ open: true, message: 'Configuration updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update configuration', severity: 'error' });
    },
  });

  // Create announcement mutation
  const announcementMutation = useMutation({
    mutationFn: () => announcementService.create(announcementTitle, announcementMessage, announcementType, broadcastToAll),
    onSuccess: () => {
      setAnnouncementDialogOpen(false);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setSnackbar({ open: true, message: 'Announcement sent successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to send announcement', severity: 'error' });
    },
  });

  const handleConfigChange = (key: string, value: any) => {
    setEditedConfigs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = (key: string) => {
    const value = editedConfigs[key];
    if (value !== undefined) {
      updateConfigMutation.mutate({ key, value });
    }
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error">Failed to load settings. You may not have permission to view this page.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h4">Settings</Typography>
        </Box>
        <IconButton onClick={() => refetch()}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Announcements */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                avatar={<AnnouncementIcon color="primary" />}
                title="Platform Announcements"
                subheader="Send announcements to all users"
              />
              <CardContent>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => setAnnouncementDialogOpen(true)}
                >
                  Create Announcement
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* System Configuration */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                avatar={<SettingsIcon color="primary" />}
                title="System Configuration"
                subheader="Manage platform settings"
              />
              <CardContent>
                {configData && Object.keys(configData).length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(configData).map(([key, value]) => (
                      <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label={key.replace(/_/g, ' ')}
                          value={editedConfigs[key] ?? (typeof value === 'object' ? JSON.stringify(value) : value)}
                          onChange={(e) => handleConfigChange(key, e.target.value)}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSaveConfig(key)}
                          disabled={editedConfigs[key] === undefined}
                        >
                          Save
                        </Button>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No configuration entries found</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Settings */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Quick Settings" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable Matchmaking"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable Tournaments"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable Deposits/Withdrawals"
                    />
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Note: These quick settings are for demonstration. Actual settings are managed via System Configuration above.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Platform Info */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Platform Information" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Version
                    </Typography>
                    <Typography variant="body1">1.0.0</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Environment
                    </Typography>
                    <Typography variant="body1">Production</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      API Endpoint
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                      {process.env.REACT_APP_API_URL || 'http://18.170.228.240:4065/api/v1'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">{new Date().toLocaleDateString()}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onClose={() => setAnnouncementDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Announcement</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Message"
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              multiline
              rows={4}
              fullWidth
              required
            />
            <TextField
              label="Type"
              value={announcementType}
              onChange={(e) => setAnnouncementType(e.target.value)}
              select
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="info">Information</option>
              <option value="warning">Warning</option>
              <option value="maintenance">Maintenance</option>
              <option value="update">Update</option>
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={broadcastToAll}
                  onChange={(e) => setBroadcastToAll(e.target.checked)}
                />
              }
              label="Broadcast to all users"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnouncementDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => announcementMutation.mutate()}
            variant="contained"
            disabled={!announcementTitle || !announcementMessage || announcementMutation.isPending}
            startIcon={<SendIcon />}
          >
            {announcementMutation.isPending ? 'Sending...' : 'Send Announcement'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
