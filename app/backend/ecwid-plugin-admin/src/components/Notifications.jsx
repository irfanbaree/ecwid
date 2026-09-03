import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Typography,
    Box,
    IconButton,
    CircularProgress
} from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';

const Notifications = ({ api, isAuthenticated }) => {
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    // Fetch notifications
    const getNotifications = useCallback(() => {
        if (!isAuthenticated) return;

        setLoading(true);
        setError(null);

        api.get(`/api/notifications?page=${page}&limit=${limit}`)
            .then(response => {
                setNotifications(response.data.notifications);
                setTotalPages(Math.ceil(response.data.totalCount / limit));
            })
            .catch(error => {
                console.error(error);
                setError('Failed to load notifications.');
            })
            .finally(() => setLoading(false));
    }, [api, page, limit, isAuthenticated]);

    // Mark a notification as read
    const markAsRead = (id) => {
        api.put(`/api/notifications/${id}`, { read: true })
            .then(() => {
                setNotifications(prevNotifications =>
                    prevNotifications.map(notification =>
                        notification.id === id ? { ...notification, read_flag: true } : notification
                    )
                );
            })
            .catch(error => {
                console.error(error);
                setError('Failed to update notification.');
            });
    };

    useEffect(() => {
        getNotifications();
    }, [getNotifications]);

    return (
        <Box sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
                Notifications
            </Typography>

            <Button variant="contained" color="primary" onClick={getNotifications} sx={{ marginBottom: 2 }}>
                Refresh
            </Button>

            {error && <Typography color="error">{error}</Typography>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', margin: 2 }}>
                    <CircularProgress />
                </Box>
            ) : notifications.length === 0 ? (
                <Typography>No notifications available.</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Message</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Read</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {notifications.map((notification) => (
                                <TableRow
                                    key={notification.id}
                                    sx={{ backgroundColor: notification.read_flag ? "inherit" : "#f0f8ff" }} // Light blue for unread
                                >
                                    <TableCell>{notification.id}</TableCell>
                                    <TableCell>{notification.details}</TableCell>
                                    <TableCell>{new Date(notification.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <IconButton disabled>
                                            {notification.read_flag ? <MarkEmailReadIcon color="success" /> : <MarkEmailUnreadIcon color="error" />}
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            color={notification.read_flag ? "disabled" : "primary"}
                                            onClick={() => markAsRead(notification.id)}
                                            disabled={notification.read_flag}
                                        >
                                            {notification.read_flag ? <MarkEmailReadIcon /> : <MarkEmailUnreadIcon />}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>

                    </Table>
                </TableContainer>
            )}

            {/* Pagination Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                <Button
                    variant="outlined"
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    sx={{ marginRight: 1 }}
                >
                    Previous
                </Button>

                <Typography variant="body1" sx={{ alignSelf: 'center' }}>
                    Page {page} of {totalPages}
                </Typography>

                <Button
                    variant="outlined"
                    onClick={() => setPage(prev => (notifications.length < limit ? prev : prev + 1))}
                    disabled={notifications.length < limit}
                    sx={{ marginLeft: 1 }}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
};

export default Notifications;
