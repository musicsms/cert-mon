import React from 'react';
import { useQuery } from 'react-query';
import {
  Paper,
  Typography,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';

const CertificateList = () => {
  const { data: certificates, isLoading, refetch } = useQuery(
    'certificates',
    async () => {
      const response = await axios.get('/api/certificates');
      return response.data;
    }
  );

  const columns = [
    { field: 'url', headerName: 'URL', width: 300 },
    { field: 'port', headerName: 'Port', width: 100 },
    { field: 'subject', headerName: 'Subject', width: 200 },
    { field: 'issuer', headerName: 'Issuer', width: 200 },
    { field: 'valid_from', headerName: 'Valid From', width: 200 },
    { field: 'valid_until', headerName: 'Valid Until', width: 200 },
    { field: 'days_to_expire', headerName: 'Days to Expire', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: any) => (
        <Alert
          severity={
            params.row.expired
              ? 'error'
              : params.row.days_to_expire <= 30
              ? 'warning'
              : 'success'
          }
        >
          {params.row.expired
            ? 'Expired'
            : params.row.days_to_expire <= 30
            ? 'Warning'
            : 'Valid'}
        </Alert>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        Certificate List
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()} size="small" sx={{ ml: 1 }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Typography>
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={certificates || []}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          loading={isLoading}
        />
      </div>
    </Paper>
  );
};

export default CertificateList;
