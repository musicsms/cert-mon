import { Paper, Typography } from '@mui/material';

const FilterContainer = ({ title, children }) => {
  return (
    <Paper sx={{ 
      p: { xs: 2, sm: 3 }, 
      mb: { xs: 2, sm: 4 }, 
      borderRadius: 2, 
      boxShadow: 2 
    }}>
      <Typography variant="h6" sx={{ 
        mb: { xs: 2, sm: 3 }, 
        fontWeight: 'bold', 
        color: 'primary.main',
        fontSize: { xs: '1.1rem', sm: '1.25rem' }
      }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
};

export default FilterContainer;
