import React from 'react';
import { useMutation } from 'react-query';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddCertificate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({
    url: '',
    port: '443',
  });
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState('');

  const mutation = useMutation(
    async (data: typeof formData) => {
      const response = await axios.post('/api/check-cert', data);
      return response.data;
    },
    {
      onSuccess: () => {
        setOpen(true);
        setTimeout(() => {
          navigate('/certificates');
        }, 2000);
      },
      onError: (error: any) => {
        setError(error.response?.data?.detail || 'An error occurred');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Add New Certificate
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="URL"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
              error={!!error}
              helperText={error}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Port"
              name="port"
              type="number"
              value={formData.port}
              onChange={handleChange}
              placeholder="443"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? 'Adding...' : 'Add Certificate'}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={() => setOpen(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Certificate added successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default AddCertificate;
