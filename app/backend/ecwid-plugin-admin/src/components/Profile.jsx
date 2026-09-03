import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Grid
} from '@mui/material';

const Profile = ({ api, isAuthenticated }) => {
    const [store, setStore] = useState(null);
    const [storeDetails, setStoreDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [billingUpdating, setBillingUpdating] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStoreDetails();
        }
    }, [isAuthenticated]);

    const fetchStoreDetails = () => {
        setLoading(true);
        api.get('/api/store')
            .then(response => {
                setStore(response.data.details);
                setStoreDetails(response.data.store);
                setLoading(false);
            })
            .catch(error => {
                setError('Failed to fetch store details');
                setLoading(false);
            });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStore(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setUpdating(true);
        api.put('/api/store', store)
            .then(() => {
                alert('Store details updated successfully!');
                setUpdating(false);
            })
            .catch(error => {
                setError('Failed to update store details');
                setUpdating(false);
            });
    };

    const handleBillingUpdate = () => {
        setBillingUpdating(true);
        api.post('/api/billing/update', { store_id: store.store_id })
            .then(() => {
                // alert('Billing details updated successfully!');
                window.location.href = '/billing';
                setBillingUpdating(false);
            })
            .catch(error => {
                setError('Failed to update trial');
                setBillingUpdating(false);
            });
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!store) return null;

    return (
        <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>Profile</Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <h4>Billing Details</h4>
                    <TextField label="Billing Name" name="billing_name" value={store.billing_name} onChange={handleChange} fullWidth margin="normal" />
                    <TextField label="Billing Email" name="billing_email" value={store.billing_email} onChange={handleChange} fullWidth margin="normal" />
                    <TextField label="Billing Phone" name="billing_phone" value={store.billing_phone} onChange={handleChange} fullWidth margin="normal" />
                    <TextField label="Billing Address" name="billing_address" value={store.billing_address} onChange={handleChange} fullWidth margin="normal" />
                    <TextField label="Billing Country" name="billing_country" value={store.billing_country} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={6}>
                    <h4>Store Information</h4>
                    <b>Store ID: </b>{store.store_id}<br/>
                    <b>Trial: </b>{store.trial ? 'Yes' : 'No'}<br/>
                    <b>Billing Date: </b>{store.billing_date}<br/>
                    <b>Store URL: </b>{storeDetails.generalInfo.storeUrl}<br/>

                    {store.trial && (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleBillingUpdate}
                            disabled={billingUpdating}
                            sx={{ mt: 2 }}
                        >
                            {billingUpdating ? <CircularProgress size={24} color="inherit" /> : 'Update Trial'}
                        </Button>
                    )}
                </Grid>
            </Grid>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={updating} sx={{ mt: 2 }}>
                {updating ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
        </Box>
    );
};

export default Profile;