import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { Link } from 'react-router-dom';

const sidebarLinks = [
  { text: 'Main Page', to: '/' },
  { text: 'Seller Dashboard', to: '/seller-dashboard' },
  { text: 'Buyer Dashboard', to: '/buyer-dashboard' },
  { text: 'Schedule Tour', to: '/add-edit-tour' },
  { text: 'Chat', to: '/chat' },
];

const drawerWidth = 240;

const Sidebar = () => (
  <Drawer
    variant="permanent"
    anchor="left"
    sx={{
      width: drawerWidth,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
        borderRight: '1px solid #e0e0e0',
        boxShadow: '2px 0 8px 0 rgba(0,0,0,0.04)',
        background: 'linear-gradient(180deg, #f5f7fa 0%, #c3cfe2 100%)',
        color: '#23395d',
      },
    }}
  >
    <List>
      {sidebarLinks.map((link) => (
        <ListItem
          button
          key={link.text}
          component={Link}
          to={link.to}
          sx={{
            '&:hover': {
              backgroundColor: '#e3eafc',
              color: '#1a237e',
            },
            borderRadius: 1,
            mx: 1,
            my: 0.5,
          }}
        >
          <ListItemText primary={link.text} />
        </ListItem>
      ))}
    </List>
  </Drawer>
);

export default Sidebar;