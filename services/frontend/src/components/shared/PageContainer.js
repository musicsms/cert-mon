import { Box } from '@mui/material';

const PageContainer = ({ children }) => {
  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f7fa',
      position: 'relative'
    }}>
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default PageContainer;
