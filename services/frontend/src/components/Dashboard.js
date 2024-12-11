import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Modal,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Dashboard() {
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    domain: '',
    commonName: '',
    issuer: '',
    serialNumber: '',
    status: 'all'
  });

  const { data: certificates = [], isLoading } = useQuery('certificates', async () => {
    const { data } = await axios.get(`${API_URL}/certificates`);
    return data;
  });

  const certificateStats = useMemo(() => {
    const now = new Date();
    return {
      total: certificates.length,
      valid: certificates.filter(cert => cert.status === 'valid').length,
      expired: certificates.filter(cert => cert.status === 'expired').length,
      expiring: certificates.filter(cert => {
        if (!cert.valid_until || cert.status !== 'valid') return false;
        const expiryDate = new Date(cert.valid_until);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30;
      }).length,
    };
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    let filtered = certificates;
    
    // Apply text filters
    if (filters.domain) {
      filtered = filtered.filter(cert => 
        cert.url.toLowerCase().includes(filters.domain.toLowerCase())
      );
    }
    if (filters.commonName) {
      filtered = filtered.filter(cert => 
        cert.subject?.toLowerCase().includes(filters.commonName.toLowerCase())
      );
    }
    if (filters.issuer) {
      filtered = filtered.filter(cert => 
        cert.issuer?.toLowerCase().includes(filters.issuer.toLowerCase())
      );
    }
    if (filters.serialNumber) {
      filtered = filtered.filter(cert => 
        cert.serial_number?.toLowerCase().includes(filters.serialNumber.toLowerCase())
      );
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(cert => cert.status === filters.status);
    }

    // Apply expiry filter
    const now = new Date();
    switch (expiryFilter) {
      case 'expiring30':
        filtered = filtered.filter(cert => {
          if (!cert.valid_until || cert.status !== 'valid') return false;
          const expiryDate = new Date(cert.valid_until);
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 30;
        });
        break;
      case 'expired':
        filtered = filtered.filter(cert => cert.status === 'expired');
        break;
      case 'valid':
        filtered = filtered.filter(cert => cert.status === 'valid');
        break;
      default:
        break;
    }
    
    return filtered;
  }, [certificates, filters, expiryFilter]);

  const deleteCertMutation = useMutation(
    async (id) => {
      await axios.delete(`${API_URL}/certificates/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('certificates');
        setAlert({ open: true, message: 'Certificate deleted successfully', severity: 'success' });
      },
    }
  );

  const refreshCertMutation = useMutation(
    async (id) => {
      await axios.post(`${API_URL}/certificates/${id}/refresh`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('certificates');
        setAlert({ open: true, message: 'Certificate refresh scheduled', severity: 'success' });
      },
    }
  );

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
    },
    onDrop: async (files) => {
      const formData = new FormData();
      formData.append('file', files[0]);
      try {
        await axios.post(`${API_URL}/certificates/import`, formData);
        queryClient.invalidateQueries('certificates');
        setAlert({ open: true, message: 'Certificates imported successfully', severity: 'success' });
      } catch (error) {
        setAlert({ open: true, message: error.response?.data?.error || 'Error importing certificates', severity: 'error' });
      }
    },
  });

  const getStatusColor = (status) => {
    if (status === 'valid') return 'success';
    if (status === 'expired') return 'error';
    return 'warning';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const handleCertificateAction = (cert, action) => {
    if (action === 'refresh') {
      refreshCertMutation.mutate(cert.id);
    } else if (action === 'delete') {
      deleteCertMutation.mutate(cert.id);
    } else if (action === 'info') {
      setSelectedCert(cert);
      setDetailModalOpen(true);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Certificate Status Overview
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h4">{certificateStats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white', borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6">Valid</Typography>
              <Typography variant="h4">{certificateStats.valid}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white', borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6">Expiring Soon</Typography>
              <Typography variant="h4">{certificateStats.expiring}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.main', color: 'white', borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6">Expired</Typography>
              <Typography variant="h4">{certificateStats.expired}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filters
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Domain"
              value={filters.domain}
              onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Common Name"
              value={filters.commonName}
              onChange={(e) => setFilters({ ...filters, commonName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Issuer"
              value={filters.issuer}
              onChange={(e) => setFilters({ ...filters, issuer: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Serial Number"
              value={filters.serialNumber}
              onChange={(e) => setFilters({ ...filters, serialNumber: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="valid">Valid</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Expiry</InputLabel>
              <Select
                value={expiryFilter}
                label="Expiry"
                onChange={(e) => setExpiryFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="valid">Valid</MenuItem>
                <MenuItem value="expiring30">Expiring in 30 days</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>URL</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Common Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Issuer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Serial Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Valid From</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Valid Until</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Days Remaining</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCertificates.map((cert) => (
              <TableRow key={cert.id} hover>
                <TableCell>{cert.url}</TableCell>
                <TableCell>{cert.subject}</TableCell>
                <TableCell>{cert.issuer}</TableCell>
                <TableCell>{cert.serial_number || 'N/A'}</TableCell>
                <TableCell>{new Date(cert.valid_from).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(cert.valid_until).toLocaleDateString()}</TableCell>
                <TableCell>
                  {cert.days_remaining !== null ? cert.days_remaining : 'N/A'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={cert.status}
                    color={
                      cert.status === 'valid'
                        ? 'success'
                        : cert.status === 'expired'
                        ? 'error'
                        : 'warning'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleCertificateAction(cert, 'info')}
                        sx={{ color: 'primary.main' }}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh">
                      <IconButton
                        size="small"
                        onClick={() => handleCertificateAction(cert, 'refresh')}
                        sx={{ color: 'success.main' }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleCertificateAction(cert, 'delete')}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredCertificates.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No certificates found matching the filters
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Certificate Detail Modal */}
      <Dialog 
        open={detailModalOpen} 
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Certificate Details</DialogTitle>
        <DialogContent>
          {selectedCert && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">URL</Typography>
                <Typography variant="body1">{selectedCert.url}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Common Name</Typography>
                <Typography variant="body1">{selectedCert.subject}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Issuer</Typography>
                <Typography variant="body1">{selectedCert.issuer}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Serial Number</Typography>
                <Typography variant="body1">{selectedCert.serial_number || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Valid From</Typography>
                <Typography variant="body1">{new Date(selectedCert.valid_from).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Valid Until</Typography>
                <Typography variant="body1">{new Date(selectedCert.valid_until).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Days Remaining</Typography>
                <Typography variant="body1">{selectedCert.days_remaining !== null ? `${selectedCert.days_remaining} days` : 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Status</Typography>
                <Chip
                  label={selectedCert.status}
                  color={
                    selectedCert.status === 'valid'
                      ? 'success'
                      : selectedCert.status === 'expired'
                      ? 'error'
                      : 'warning'
                  }
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailModalOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Dashboard;
