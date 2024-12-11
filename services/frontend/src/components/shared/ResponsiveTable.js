import { Box, Paper, Table, TableContainer } from '@mui/material';

const ResponsiveTable = ({ children }) => {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <TableContainer component={Paper} sx={{ 
        borderRadius: 2, 
        boxShadow: 3,
        minWidth: { xs: '100%', md: 'auto' }
      }}>
        <Table sx={{ 
          '& th, & td': { 
            px: { xs: 1, sm: 2 },
            py: { xs: 1, sm: 1.5 },
            whiteSpace: 'nowrap'
          }
        }}>
          {children}
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ResponsiveTable;
