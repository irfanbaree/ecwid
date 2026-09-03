import React, { useState } from 'react';
import {
    Box,
    CssBaseline,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Button,
    Badge,
    Menu,
    MenuItem,
    Avatar,
    ListSubheader
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    Category as CategoryIcon,
    Backpack as PackIcon,
    Store as StoreIcon,
    ExitToApp as LogoutIcon,
    Notifications as NotificationsIcon,
    Report as ReportIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        flexGrow: 1,
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: `-${drawerWidth}px`,
        ...(open && {
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
        }),
    }),
);

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        ...(open && {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: `${drawerWidth}px`,
            transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
        }),
    }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
}));

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
};

const Layout = ({ children, handleLogout, notifications, noteCount }) => {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerOpen = () => setOpen(true);
    const handleDrawerClose = () => setOpen(false);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleNotificationOpen = (event) => setNotificationAnchorEl(event.currentTarget);
    const handleNotificationClose = () => setNotificationAnchorEl(null);

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Products', icon: <InventoryIcon />, path: '/products' },
        { text: 'Bundles', icon: <PackIcon />, path: '/packbundles' },
        { text: 'Bundle Options', icon: <StoreIcon />, path: '/storeoptions' },
        // { text: 'Bundles', icon: <CategoryIcon />, path: '/bundles' },
        { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBarStyled position="fixed" open={open}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        sx={{ mr: 2, ...(open && { display: 'none' }) }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Ecwid Plugin Admin
                    </Typography>

                    {/* Notification Icon */}
                    <IconButton color="inherit" onClick={handleNotificationOpen}>
                        <Badge badgeContent={noteCount} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    {/* Notification Menu */}
                    <Menu
                        anchorEl={notificationAnchorEl}
                        open={Boolean(notificationAnchorEl)}
                        onClose={handleNotificationClose}
                        PaperProps={{
                            style: { width: 300 },
                        }}
                    >
                        <ListSubheader>Notifications</ListSubheader>
                        {notifications.slice(0, 5).map((notif, index) => (
                            <MenuItem
                                key={index}
                                onClick={handleNotificationClose}
                                sx={{
                                    backgroundColor: notif.read_flag ? 'transparent' : 'rgba(0, 123, 255, 0.1)', // Highlight unread notifications with a blue tint
                                    '&:hover': {
                                        backgroundColor: notif.read_flag ? 'transparent' : 'rgba(0, 123, 255, 0.2)', // Hover effect for unread notifications
                                    }
                                }}
                            >
                                <Box display="flex" flexDirection="column" width="100%">
                                    <Typography variant="body2">{notif.details}</Typography>
                                    <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'right', marginTop: 0 }}>
                                        {formatDate(notif.createdAt)}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                        <Divider />
                        <MenuItem onClick={() => navigate('/notifications')}>More...</MenuItem>
                    </Menu>


                    {/* Profile Avatar */}
                    <IconButton color="inherit" onClick={handleMenuOpen}>
                        <Avatar alt="User" src="/static/images/avatar/1.jpg" />
                    </IconButton>

                    {/* Profile Menu */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
                        <MenuItem onClick={() => navigate('/billing')}>Billing</MenuItem>
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBarStyled>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
                variant="persistent"
                anchor="left"
                open={open}
            >
                <DrawerHeader>
                    <IconButton onClick={handleDrawerClose}>
                        <ChevronLeftIcon />
                    </IconButton>
                </DrawerHeader>
                <Divider />
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                selected={location.pathname === item.path}
                                onClick={() => navigate(item.path)}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Main open={open}>
                <DrawerHeader />
                {children}
            </Main>
        </Box>
    );
};

export default Layout;