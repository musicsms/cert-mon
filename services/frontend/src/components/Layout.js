import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Toolbar from '@mui/material/Toolbar';
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
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Certificate Monitor
          </Typography>
        </Toolbar>
        <Container maxWidth="xl">
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{ 
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: '#fff',
                }
              },
            }}
            TabIndicatorProps={{
              style: {
                backgroundColor: '#fff',
              }
            }}
          >
            <Tab label="Dashboard" sx={{ minWidth: 120 }} />
            <Tab label="Add Domain" sx={{ minWidth: 120 }} />
          </Tabs>
        </Container>
      </AppBar>

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
