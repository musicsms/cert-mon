import React from 'react';
import { useQuery } from 'react-query';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const Dashboard = () => {
  const { data: expiringCerts, isLoading } = useQuery('expiringCerts', async () => {
    const response = await axios.get('/api/certificates/expiring/30');
    return response.data;
  });

  const columns = [
    { field: 'url', headerName: 'URL', width: 300 },
    { field: 'days_to_expire', headerName: 'Days to Expire', width: 150 },
    { field: 'valid_until', headerName: 'Expiry Date', width: 200 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: any) => (
        <Alert severity={params.row.days_to_expire <= 7 ? 'error' : 'warning'}>
          {params.row.days_to_expire <= 7 ? 'Critical' : 'Warning'}
        </Alert>
      ),
    },
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Certificates
            </Typography>
            <Typography variant="h5">
              {isLoading ? '...' : expiringCerts?.length || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Expiring Soon
            </Typography>
            <Typography variant="h5" color="error">
              {isLoading
                ? '...'
                : expiringCerts?.filter((cert: any) => cert.days_to_expire <= 30)
                    .length || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Healthy Certificates
            </Typography>
            <Typography variant="h5" color="success">
              {isLoading
                ? '...'
                : expiringCerts?.filter((cert: any) => cert.days_to_expire > 30)
                    .length || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Certificates Expiring Soon
          </Typography>
          {isLoading ? (
            <Typography>Loading...</Typography>
          ) : (
            <DataGrid
              rows={expiringCerts || []}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
            />
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
