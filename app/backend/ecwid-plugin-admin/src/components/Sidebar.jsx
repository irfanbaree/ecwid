import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Divider, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import LayersIcon from '@mui/icons-material/Layers';
import {LogoutOutlined} from "@mui/icons-material";

const Sidebar = () => {
    return (
        <Box sx={{ width: 250, bgcolor: 'background.paper' }}>
            <List>
                <ListItem button component={Link} to="/">
                    <ListItemIcon>
                        <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button component={Link} to="/products">
                    <ListItemIcon>
                        <InventoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Products" />
                </ListItem>
                <ListItem button component={Link} to="/bundles">
                    <ListItemIcon>
                        <LayersIcon />
                    </ListItemIcon>
                    <ListItemText primary="Bundles" />
                </ListItem>
            </List>
            <Divider />
        </Box>
    );
};

export default Sidebar;