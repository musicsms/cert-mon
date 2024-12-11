import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Dashboard from './Dashboard';
import AddDomain from './AddDomain';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function Layout() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="xl">
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography 
            variant="h6" 
            component="div"
            sx={{ 
              fontSize: '1.25rem',
              fontWeight: 500,
              letterSpacing: '0.5px',
              color: 'text.primary'
            }}
          >
            Certificate Monitor
          </Typography>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{ 
              '& .MuiTab-root': {
                color: 'text.secondary',
                minHeight: '48px',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 400,
                px: 3,
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 500
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main'
              }
            }}
          >
            <Tab label="Dashboard" />
            <Tab label="Add Domain" />
          </Tabs>
        </Box>
      </Container>

      <Container maxWidth="xl">
        <TabPanel value={currentTab} index={0}>
          <Dashboard />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <AddDomain />
        </TabPanel>
      </Container>
    </Box>
  );
}

export default Layout;
