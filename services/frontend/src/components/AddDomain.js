import React, { useState } from 'react';
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Box,
  Alert,
  Snackbar,
  Container
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Import shared components
import PageContainer from './shared/PageContainer';

const API_URL = '/api';

function AddDomain() {
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState({
    protocol: 'https',
    domain: '',
    port: '443'
  });
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  // Configure axios defaults
  React.useEffect(() => {
    axios.defaults.baseURL = window.location.origin;
  }, []);

  const addDomainMutation = useMutation({
    mutationFn: async (domainData) => {
      try {
        const url = `${domainData.protocol}://${domainData.domain}${domainData.port !== '443' && domainData.port !== '80' ? `:${domainData.port}` : ''}`;
        console.log('Adding domain:', url);
        const response = await axios.post(`${API_URL}/certificates`, { url });
        return response.data;
      } catch (error) {
        console.error('Error adding domain:', error);
        if (error.response) {
          console.error('Error Response:', error.response.data);
          console.error('Error Status:', error.response.status);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['certificates']);
      setNewDomain({ protocol: 'https', domain: '', port: '443' });
      setAlert({ 
        open: true, 
        message: 'Domain added successfully for monitoring', 
        severity: 'success' 
      });
    },
    onError: (error) => {
      setAlert({ 
        open: true, 
        message: error.response?.data?.error || 'Error adding domain', 
        severity: 'error' 
      });
    }
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
    },
    onDrop: async (files) => {
      try {
        const formData = new FormData();
        formData.append('file', files[0]);
        console.log('Importing domains from CSV');
        await axios.post(`${API_URL}/certificates/import`, formData);
        queryClient.invalidateQueries(['certificates']);
        setAlert({ 
          open: true, 
          message: 'Domains imported successfully', 
          severity: 'success' 
        });
      } catch (error) {
        console.error('Error importing domains:', error);
        if (error.response) {
          console.error('Error Response:', error.response.data);
        }
        setAlert({ 
          open: true, 
          message: error.response?.data?.error || 'Error importing domains', 
          severity: 'error' 
        });
      }
    },
  });

  const handleAddDomain = (e) => {
    e.preventDefault();
    if (newDomain.domain) {
      addDomainMutation.mutate(newDomain);
    }
  };

  return (
    <PageContainer>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        mb: 3,
        mx: 3
      }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<ArrowBackIcon />}
          onClick={() => window.location.href = '/'}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 3
          }}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, flex: 1 }}>
        <Box sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: 'md',
          mx: 'auto',
          width: '100%'
        }}>
          <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Protocol</InputLabel>
                <Select
                  value={newDomain.protocol}
                  label="Protocol"
                  onChange={(e) => setNewDomain({ ...newDomain, protocol: e.target.value })}
                >
                  <MenuItem value="https">HTTPS</MenuItem>
                  <MenuItem value="http">HTTP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Domain"
                placeholder="example.com"
                value={newDomain.domain}
                onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Port"
                placeholder="443"
                value={newDomain.port}
                onChange={(e) => setNewDomain({ ...newDomain, port: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ 
                  mt: { xs: 1, sm: 2 },
                  height: { xs: 40, sm: 48 }
                }}
                onClick={handleAddDomain}
              >
                Add Domain
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.dark',
              bgcolor: 'action.hover',
            }
          }}
        >
          <input {...getInputProps()} />
          <UploadFileIcon sx={{ 
            fontSize: { xs: '2rem', sm: '3rem' },
            color: 'primary.main',
            mb: 1
          }} />
          <Typography variant="body1" sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' },
            color: 'text.secondary'
          }}>
            Drag and drop a CSV file here, or click to select
          </Typography>
          <Typography variant="caption" sx={{ 
            display: 'block',
            mt: 1,
            color: 'text.secondary',
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}>
            CSV format: domain,port (optional)
          </Typography>
        </Box>

        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{ bottom: { xs: 16, sm: 24 } }}
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
}

export default AddDomain;
