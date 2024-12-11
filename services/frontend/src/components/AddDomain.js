import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

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
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 4 }}>Add Domain to Monitor</Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleAddDomain}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Enter Domain Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Domain"
                value={newDomain.domain}
                onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                required
                placeholder="example.com"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Port"
                value={newDomain.port}
                onChange={(e) => setNewDomain({ ...newDomain, port: e.target.value })}
                placeholder="443"
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                onClick={handleAddDomain}
                disabled={!newDomain.domain}
                sx={{ mt: 2 }}
              >
                Add Domain
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 3 }}>
          Import Domains from CSV
        </Typography>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 1,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <input {...getInputProps()} />
          <Typography variant="body1" sx={{ mb: 1 }}>
            Drag and drop a CSV file here, or click to select
          </Typography>
          <Typography variant="caption" color="text.secondary">
            CSV format: protocol,domain,port (e.g., https,example.com,443)
          </Typography>
        </Box>
      </Paper>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AddDomain;
