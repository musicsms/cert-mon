import React, { useState, useEffect } from 'react';
import {
  Button,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Snackbar,
  Alert,
  Link
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';

// Import shared components
import PageContainer from './shared/PageContainer';
import ContentCard from './shared/ContentCard';
import FilterContainer from './shared/FilterContainer';
import ResponsiveTable from './shared/ResponsiveTable';

const API_URL = '/api';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(16); // Default 16 hours
  const [filters, setFilters] = useState({
    url: '', // Changed from domain to url to match table column
    commonName: '',
    issuer: '',
    serialNumber: '',
    status: 'all'
  });

  // Configure axios defaults
  React.useEffect(() => {
    axios.defaults.baseURL = window.location.origin;
  }, []);

  const { data: certificates = [], isLoading, error } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_URL}/certificates`);
        return response.data;
      } catch (error) {
        console.error('API Error:', error);
        setAlert({
          open: true,
          message: error.response?.data?.error || 'Failed to fetch certificates. Please try again.',
          severity: 'error'
        });
        throw error;
      }
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes frontend refresh
    retry: 3
  });

  // Add a function to handle refresh interval change
  const handleRefreshIntervalChange = async (event) => {
    const newInterval = event.target.value;
    setRefreshInterval(newInterval);
    try {
      await axios.post(`${API_URL}/settings/refresh-interval`, { interval: newInterval });
      setAlert({
        open: true,
        message: 'Certificate check interval updated successfully',
        severity: 'success'
      });
    } catch (error) {
      setAlert({
        open: true,
        message: 'Failed to update certificate check interval',
        severity: 'error'
      });
    }
  };

  const certificateStats = React.useMemo(() => {
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

  const filteredCertificates = React.useMemo(() => {
    let filtered = certificates;
    
    // Apply text filters
    if (filters.url) {
      filtered = filtered.filter(cert => 
        cert.url.toLowerCase().includes(filters.url.toLowerCase())
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

  const deleteCertMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['certificates']);
      setAlert({
        open: true,
        message: 'Certificate deleted successfully',
        severity: 'success'
      });
    },
    onError: (error) => {
      setAlert({
        open: true,
        message: error.response?.data?.error || 'Failed to delete certificate',
        severity: 'error'
      });
    }
  });

  const refreshCertMutation = useMutation({
    mutationFn: async (id) => {
      await axios.post(`${API_URL}/certificates/${id}/refresh`);
    },
    onSuccess: () => {
      setAlert({
        open: true,
        message: 'Certificate check triggered successfully',
        severity: 'success'
      });
      // Refetch after a short delay to get the updated status
      setTimeout(() => {
        queryClient.invalidateQueries(['certificates']);
      }, 2000);
    },
    onError: (error) => {
      setAlert({
        open: true,
        message: error.response?.data?.error || 'Error triggering certificate check',
        severity: 'error'
      });
    }
  });

  const getStatusColor = (status) => {
    if (status === 'valid') return 'success';
    if (status === 'expired') return 'error';
    return 'warning';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const utcDate = new Date(dateString);
    // Get local timezone offset in minutes
    const offsetMinutes = utcDate.getTimezoneOffset();
    // Convert UTC to local time by subtracting the offset
    const localDate = new Date(utcDate.getTime() - (offsetMinutes * 60000));
    
    return localDate.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    });
  };

  const handleCertificateAction = (cert, action) => {
    switch (action) {
      case 'info':
        setSelectedCert(cert);
        setDetailModalOpen(true);
        break;
      case 'refresh':
        refreshCertMutation.mutate(cert.id);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this certificate?')) {
          deleteCertMutation.mutate(cert.id);
        }
        break;
      default:
        break;
    }
  };

  return (
    <PageContainer>
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, flex: 1 }}>
        {/* Stats Grid */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
          <Grid item xs={12} sm={6} md={3}>
            <ContentCard title="Total" value={certificateStats.total} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ContentCard title="Valid" value={certificateStats.valid} color="success.dark" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ContentCard title="Expiring Soon" value={certificateStats.expiring} color="warning.dark" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ContentCard title="Expired" value={certificateStats.expired} color="error.dark" />
          </Grid>
        </Grid>

        {/* Filters */}
        <FilterContainer title="Filters">
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>URL</InputLabel>
                <Select
                  value={filters.url}
                  label="URL"
                  onChange={(e) => setFilters({ ...filters, url: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  {certificates.map((cert) => (
                    <MenuItem key={cert.id} value={cert.url}>{cert.url}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Common Name</InputLabel>
                <Select
                  value={filters.commonName}
                  label="Common Name"
                  onChange={(e) => setFilters({ ...filters, commonName: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  {certificates.map((cert) => (
                    <MenuItem key={cert.id} value={cert.subject}>{cert.subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Issuer</InputLabel>
                <Select
                  value={filters.issuer}
                  label="Issuer"
                  onChange={(e) => setFilters({ ...filters, issuer: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  {certificates.map((cert) => (
                    <MenuItem key={cert.id} value={cert.issuer}>{cert.issuer}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Serial Number</InputLabel>
                <Select
                  value={filters.serialNumber}
                  label="Serial Number"
                  onChange={(e) => setFilters({ ...filters, serialNumber: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  {certificates.map((cert) => (
                    <MenuItem key={cert.id} value={cert.serial_number}>{cert.serial_number}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
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
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
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
        </FilterContainer>

        {/* Certificates Table */}
        <ResponsiveTable>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>URL</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Common Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>Issuer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>Serial Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Valid From</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Valid Until</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Days</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Last Checked</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCertificates.map((cert) => (
              <TableRow key={cert.id} hover>
                <TableCell sx={{ maxWidth: { xs: 150, sm: 200 }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cert.url}
                </TableCell>
                <TableCell sx={{ maxWidth: { xs: 150, sm: 200 }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cert.subject}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: { xs: 150, sm: 200 }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cert.issuer}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: { xs: 100, sm: 150 }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cert.serial_number || 'N/A'}
                </TableCell>
                <TableCell>{formatDate(cert.valid_from)}</TableCell>
                <TableCell>{formatDate(cert.valid_until)}</TableCell>
                <TableCell>
                  {cert.days_remaining !== null ? cert.days_remaining : 'N/A'}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {formatDate(cert.last_checked)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={cert.status}
                    size="small"
                    color={
                      cert.status === 'valid'
                        ? 'success'
                        : cert.status === 'expired'
                        ? 'error'
                        : 'warning'
                    }
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, height: { xs: 24, sm: 32 } }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, flexWrap: 'nowrap' }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleCertificateAction(cert, 'info')}
                        sx={{ color: 'primary.main', padding: { xs: 0.5, sm: 1 } }}
                      >
                        <InfoIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh">
                      <IconButton
                        size="small"
                        onClick={() => handleCertificateAction(cert, 'refresh')}
                        sx={{ color: 'success.main', padding: { xs: 0.5, sm: 1 } }}
                      >
                        <RefreshIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleCertificateAction(cert, 'delete')}
                        sx={{ color: 'error.main', padding: { xs: 0.5, sm: 1 } }}
                      >
                        <DeleteIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredCertificates.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: { xs: 2, sm: 3 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: 'inherit' }}>
                    No certificates found matching the filters
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ResponsiveTable>

        {/* Certificate Detail Modal */}
        <Dialog 
          open={detailModalOpen} 
          onClose={() => setDetailModalOpen(false)}
          maxWidth="md"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              width: { xs: '95%', sm: '80%', md: '70%' },
              margin: { xs: 1, sm: 2 }
            }
          }}
        >
          <DialogTitle sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, py: { xs: 1.5, sm: 2 } }}>
            Certificate Details
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            {selectedCert && (
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    URL
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-all' }}>
                    {selectedCert.url}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Common Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-all' }}>
                    {selectedCert.subject}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Issuer
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-all' }}>
                    {selectedCert.issuer}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Serial Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-all' }}>
                    {selectedCert.serial_number || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Valid From
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-all' }}>
                    {formatDate(selectedCert.valid_from)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Valid Until
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-all' }}>
                    {formatDate(selectedCert.valid_until)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Days Remaining
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-all' }}>
                    {selectedCert.days_remaining !== null ? `${selectedCert.days_remaining} days` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedCert.status}
                    size="small"
                    color={
                      selectedCert.status === 'valid'
                        ? 'success'
                        : selectedCert.status === 'expired'
                        ? 'error'
                        : 'warning'
                    }
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, height: { xs: 24, sm: 32 } }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Button 
              onClick={() => setDetailModalOpen(false)} 
              color="primary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{
            bottom: { xs: 16, sm: 24 }
          }}
        >
          <Alert 
            severity={alert.severity} 
            sx={{ 
              width: '100%',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      </Container>
    </PageContainer>
  );
};

export default Dashboard;
