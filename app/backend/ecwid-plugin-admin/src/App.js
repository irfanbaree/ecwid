import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {Container, Box, CssBaseline, Typography, Alert, Button} from '@mui/material';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Bundles from './components/Bundles';
import Notifications from './components/Notifications';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Billing from './components/Billing';
import Profile from './components/Profile';
import Layout from './Layout';
import axios from "axios";
import Report from './components/reports/Report';
import PackBundle from './components/PackBundle';
import EcwidProduct from './components/EcwidProduct';
import StoreOptions from './components/StoreOptions';
import ProductOptionsManager from './components/StoreOptions';

const stripePromise = loadStripe('pk_live_51Rh71YLB25qpjPjOdBTbVUGHKmAcD0s4tEdAEhGjVeilfKKX8qyyvgV0h4iwYGFPmqYozpgJ0lHukDWAAKteVQNn00vOtVKWTj');
const App = () => {
    const [products, setProducts] = useState([]);
    const [storeActive, setStoreActive] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [noteCount, setNoteCount] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState(null);
    const [storeId, setStoreId] = useState(null);
    const [publicToken, setPublicToken] = useState(null);
    const [authError, setAuthError] = useState(null);

    const getNotifications = () => {
        api.get('/api/notifications')
            .then(response => { setNotifications(response.data.notifications);setNoteCount(response.data.unreadCount)})
            .catch(error => console.error(error));

    };

    const ECWID_CLIENT_ID = process.env.REACT_APP_ECWID_CLIENT_ID;
    const ECWID_CLIENT_SECRET = process.env.REACT_APP_ECWID_CLIENT_SECRET;
    const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;

    const api = axios.create({
        baseURL: 'https://bundleproducts.jhnerd.com:3339',
    });

    // Set up axios interceptor to include access token
    api.interceptors.request.use((config) => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            config.headers.store_id = `${storeId}`;
            config.headers.public_token = `${publicToken}`;
        }
        return config;
    });

    // Handle OAuth authentication
    const handleAuth = () => {
        const scope = 'read_products write_products read_catalog write_catalog, update_catalog, create_catalog, read_orders';
        const authUrl = `https://my.ecwid.com/api/oauth/authorize?client_id=${ECWID_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&response_type=code`;
        // console.log(authUrl);return;
        window.location.href = authUrl;
    };

    // Handle OAuth callback
    useEffect(() => {
        const handleOAuthCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (code) {
                try {
                    const response = await api.post('/api/oauth/token', {
                        code,
                        client_id: ECWID_CLIENT_ID,
                        client_secret: ECWID_CLIENT_SECRET,
                        redirect_uri: REDIRECT_URI,
                        grant_type: 'authorization_code'
                    });

                    const { access_token, store_id, public_token } = response.data;
                    setAccessToken(access_token);
                    setStoreId(store_id);
                    setIsAuthenticated(true);
                    setPublicToken(public_token);
                    // Remove code from URL
                    window.history.replaceState({}, document.title, window.location.pathname);

                    // Store tokens in localStorage
                    localStorage.setItem('ecwid_access_token', access_token);
                    localStorage.setItem('ecwid_store_id', store_id);
                    localStorage.setItem('ecwid_public_token', public_token);
                    window.location.href = "/";
                } catch (error) {
                    console.error('OAuth error:', error);
                    setAuthError('Failed to authenticate with Ecwid');
                }
            }
        };

        // Check for stored tokens
        const storedToken = localStorage.getItem('ecwid_access_token');
        const storedStoreId = localStorage.getItem('ecwid_store_id');
        const storedPublicToken = localStorage.getItem('ecwid_public_token');

        if (storedToken && storedStoreId) {
            setAccessToken(storedToken);
            setStoreId(storedStoreId);
            setPublicToken(storedPublicToken);
            setIsAuthenticated(true);
        } else if (window.location.search.includes('code=')) {
            handleOAuthCallback();
        }
    }, []);

    // Logout function
    const handleLogout = () => {
        setAccessToken(null);
        setStoreId(null);
        setPublicToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('ecwid_access_token');
        localStorage.removeItem('ecwid_store_id');
        localStorage.removeItem('ecwid_public_token');
    };

    /*const getProducts = () => {
        api.get('/api/products')
            .then(response => {
                setProducts(response.data.items);
            })
            .catch(error => console.error(error));
    };*/

    const checkStoreStatus = async () => {
        try {
            const response = await api.get('/api/store');
            const storeDetails = response.data.details;
            console.log(storeDetails);
            if (storeDetails && storeDetails.active === false) {
                setStoreActive(false);
                if (location.pathname !== '/billing') {
                    alert('Store Status is deactivated. Please pay bill to contiue or contact support in case of any issue');
                    window.location.href = '/billing';
                }
            }else{
                setStoreActive(true);
            }
        } catch (error) {
            console.error('Error checking store status:', error);
        }
    };
    useEffect(() => {
        if (isAuthenticated) {
           /*getProducts();*/
            getNotifications();
            checkStoreStatus();
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <Container>
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom>
                        Welcome to Ecwid Plugin Admin
                    </Typography>
                    {authError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {authError}
                        </Alert>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAuth}
                        size="large"
                    >
                        Connect with Ecwid
                    </Button>
                </Box>
            </Container>
        );
    }
    if (!storeActive) {
        return (
            <Router>
                <Layout handleLogout={handleLogout} notifications={notifications} noteCount={noteCount}>
                    <Routes>
                        <Route path="/profile" element={<Profile api={api} isAuthenticated={isAuthenticated}/>}/>
                        <Route path="/billing" element={<Elements stripe={stripePromise}>
                            <Billing api={api} isAuthenticated={isAuthenticated}/>
                        </Elements>}/>
                    </Routes>
                </Layout>
            </Router>
        );
    }else {

        return (
            <Router>
                <Layout handleLogout={handleLogout} notifications={notifications} noteCount={noteCount}>
                    <Routes>
                        <Route path="/reports" element={<Report api={api} isAuthenticated={isAuthenticated}/>}/>
                        <Route path="/products" element={<Products api={api} isAuthenticated={isAuthenticated}/>}/>
                        <Route path="/bundles" element={<Bundles api={api} isAuthenticated={isAuthenticated}/>}/>
                        <Route path="/packbundles"
                               element={<EcwidProduct api={api} isAuthenticated={isAuthenticated}/>}/>
                        <Route path="/storeoptions"
                               element={<ProductOptionsManager api={api} isAuthenticated={isAuthenticated}/>}/>
                        <Route path="/notifications"
                               element={<Notifications api={api} isAuthenticated={isAuthenticated}/>}/>
                        <Route path="/profile" element={<Profile api={api} isAuthenticated={isAuthenticated}/>}/>
                        <Route path="/billing" element={<Elements stripe={stripePromise}>
                            <Billing api={api} isAuthenticated={isAuthenticated}/>
                        </Elements>}/>
                        <Route path="/" element={<Dashboard api={api} isAuthenticated={isAuthenticated}/>}/>
                    </Routes>
                </Layout>
            </Router>
        );
    }
};

export default App;