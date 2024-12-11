import { Box, Typography } from '@mui/material';

const Header = ({ title, children }) => {
  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      bgcolor: 'primary.main', 
      color: 'white',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      alignItems: 'center',
      gap: { xs: 2, md: 0 },
      justifyContent: 'space-between',
      borderRadius: '0 0 16px 16px',
      mb: 3
    }}>
      <Typography variant="h5" component="h1" sx={{ 
        fontWeight: 500,
        fontSize: { xs: '1.4rem', sm: '1.8rem' },
        letterSpacing: '0.5px',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)'
      }}>
        {title}
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        alignItems: 'center',
        flexDirection: { xs: 'column', sm: 'row' },
        width: { xs: '100%', sm: 'auto' }
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default Header;
