import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { Link } from 'react-router-dom';

const sidebarLinks = [
  { text: 'Landing', to: '/' },
  { text: 'Seller Dashboard', to: '/seller-dashboard' },
  { text: 'Buyer Dashboard', to: '/buyer-dashboard' },
  { text: 'Chat', to: '/chat' },
];

const drawerWidth = 240;

const Sidebar = () => (
  <Drawer variant="permanent" anchor="left" sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
    <List>
      {sidebarLinks.map((link) => (
        <ListItem button key={link.text} component={Link} to={link.to}>
          <ListItemText primary={link.text} />
        </ListItem>
      ))}
    </List>
  </Drawer>
);

export default Sidebar;