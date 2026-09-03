import React, { useEffect, useState, memo } from 'react';
import axios from 'axios';
import {
    Container,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Stepper,
    Step,
    StepLabel,
    Typography,
    IconButton,
    Alert
} from '@mui/material';

// OAuth Configuration
const ECWID_CLIENT_ID = 'bundleproduct-dev';
const ECWID_CLIENT_SECRET = 'OH2AvY5eKxCxjbTE5oZXeYLjadTY4Y3a';
const REDIRECT_URI = 'https://bundleproducts.jhnerd.com/oauth/callback';

const ProductSelectionStep = memo(({ products, searchQuery, setSearchQuery, newBundle, setNewBundle }) => (
    <Box sx={{ width: '100%' }}>
        <TextField
            fullWidth
            label="Search Products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            margin="normal"
        />
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {products.map((product) => (
                <ListItem key={product.id} divider>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <img
                            src={product.smallThumbnailUrl}
                            alt={product.name}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '16px' }}
                        />
                        <ListItemText
                            primary={product.name}
                            secondary={`Price: ${product.defaultDisplayedPriceFormatted}`}
                        />
                        <ListItemSecondaryAction>
                            <Checkbox
                                checked={newBundle.productIds.includes(product.id)}
                                onChange={() => {
                                    setNewBundle(prev => ({
                                        ...prev,
                                        productIds: prev.productIds.includes(product.id)
                                            ? prev.productIds.filter(id => id !== product.id)
                                            : [...prev.productIds, product.id]
                                    }));
                                }}
                            />
                        </ListItemSecondaryAction>
                    </Box>
                </ListItem>
            ))}
        </List>
    </Box>
));

const BundleDetailsStep = memo(({ products, newBundle, setNewBundle }) => (
    <Box sx={{ width: '100%' }}>
        <TextField
            label="Bundle Name"
            fullWidth
            value={newBundle.name}
            onChange={(e) => setNewBundle(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
        />
        <TextField
            label="Product SKU"
            fullWidth
            value={newBundle.sku}
            onChange={(e) => setNewBundle(prev => ({ ...prev, sku: e.target.value }))}
            margin="normal"
        />
        <TextField
            label="Discount Percentage"
            type="number"
            fullWidth
            value={newBundle.discount}
            onChange={(e) => setNewBundle(prev => ({ ...prev, discount: e.target.value }))}
            margin="normal"
            inputProps={{
                min: 0,
                max: 100,
                step: 0.1
            }}
        />
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Selected Products:</Typography>
            <List>
                {products
                    .filter(product => newBundle.productIds.includes(product.id))
                    .map(product => (
                        <ListItem key={product.id}>
                            <ListItemText
                                primary={product.name}
                                secondary={`Price: ${product.defaultDisplayedPriceFormatted}`}
                            />
                        </ListItem>
                    ))
                }
            </List>
        </Box>
    </Box>
));

function App() {
    const [products, setProducts] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [stockQuantity, setStockQuantity] = useState('');
    const [openBundleDialog, setOpenBundleDialog] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [newBundle, setNewBundle] = useState({
        id: null,
        name: '',
        productIds: [],
        discount: '',
        sku: ''
    });
    const [editMode, setEditMode] = useState(false);

    // New OAuth-related state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState(null);
    const [publicToken, setPublicToken] = useState(null);
    const [storeId, setStoreId] = useState(null);
    const [authError, setAuthError] = useState(null);

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
        const scope = 'read_products write_products read_catalog write_catalog, update_catalog, create_catalog';
        const authUrl = `https://my.ecwid.com/api/oauth/authorize?client_id=${ECWID_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&response_type=code`;
        // console.log(authUrl);return;
        window.location.href = authUrl;
    };

    const getProducts = () => {
        api.get('/api/products')
            .then(response => {
                setProducts(response.data.items);
            })
            .catch(error => console.error(error));
    };

    const getBundles = () => {
        api.get('/api/bundles')
            .then(response => {
                setBundles(response.data.bundles);
            })
            .catch(error => console.error(error));
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


    useEffect(() => {
        if (isAuthenticated) {
            getProducts();
            getBundles();
        }
    }, [isAuthenticated]);

    const filteredProducts = React.useMemo(() =>
            products.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [products, searchQuery]
    );

    const handleNext = () => {
        if (activeStep === 0 && newBundle.productIds.length === 0) {
            alert('Please select at least one product');
            return;
        }
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleClose = () => {
        setOpenBundleDialog(false);
        setActiveStep(0);
        setSearchQuery('');
        setNewBundle({
            id: null,
            name: '',
            productIds: [],
            discount: '',
            sku: ''
        });
        setEditMode(false);
    };

    const handleCreateOrUpdateBundle = () => {
        if (!newBundle.name || !newBundle.discount || !newBundle.sku) {
            alert('Please fill in all fields');
            return;
        }

        const method = editMode ? 'put' : 'post';
        const url = editMode ? `/api/bundles/${newBundle.id}` : '/api/bundles';

        api[method](url, {
            name: newBundle.name,
            productIds: newBundle.productIds,
            discount: parseFloat(newBundle.discount),
            sku: newBundle.sku
        })
            .then(response => {
                if (editMode) {
                    setBundles(bundles.map(b =>
                        b.id === newBundle.id ? response.data : b
                    ));
                } else {
                    setBundles([...bundles, response.data]);
                }
                handleClose();
            })
            .catch(error => {
                console.error(error);
                alert(`Failed to ${editMode ? 'update' : 'create'} bundle`);
            });
    };

    const handleDeleteBundle = (bundleId) => {
        if (confirm('Are you sure you want to delete this bundle?')) {
            api.delete(`/api/bundles/${bundleId}`)
                .then(() => {
                    setBundles(bundles.filter(b => b.id !== bundleId));
                })
                .catch(error => {
                    console.error(error);
                    alert('Failed to delete bundle');
                });
        }
    };

    const handleEditBundle = (bundle) => {
        setNewBundle({
            id: bundle.id,
            name: bundle.name,
            productIds: bundle.product_ids,
            discount: bundle.discount,
            sku: bundle.sku
        });
        setEditMode(true);
        setOpenBundleDialog(true);
    };

    const handleSelectProduct = (productId) => {
        setSelectedProducts(prevSelected =>
            prevSelected.includes(productId)
                ? prevSelected.filter(id => id !== productId)
                : [...prevSelected, productId]
        );
    };

    const deleteProduct = () => {
        if (selectedProducts.length === 0) {
            alert('Please select products first');
            return;
        }
        if (confirm('Are You sure? You want to delete these products?')) {
            selectedProducts.forEach(productId => {
                api.delete(`/api/products/${productId}/`)
                    .then(() => {
                        getProducts();
                        getBundles();
                    })
                    .catch(error => console.error(error));
            });
        }
    };

    const handleUpdateStock = () => {
        const quantity = parseInt(stockQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid quantity.');
            return;
        }

        selectedProducts.forEach(productId => {
            api.put(`/api/products/${productId}/stock`, { stock: quantity })
                .then(() => {
                    alert(`Stock updated for product ID: ${productId}`);
                })
                .catch(error => console.error(error));
        });

        setOpenDialog(false);
    };
    // Modified return statement to include authentication state
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

    return (
        <Container>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <h1>Ecwid Plugin Admin</h1>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleLogout}
                >
                    Logout
                </Button>
            </Box>

            <h2>Products</h2>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Checkbox
                                    checked={selectedProducts.length === products.length}
                                    onChange={() => {
                                        if (selectedProducts.length === products.length) {
                                            setSelectedProducts([]);
                                        } else {
                                            setSelectedProducts(products.map(product => product.id));
                                        }
                                    }}
                                />
                            </TableCell>
                            <TableCell>ID</TableCell>
                            <TableCell>Image</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Stock</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.map(product => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => handleSelectProduct(product.id)}
                                    />
                                </TableCell>
                                <TableCell>{product.id}</TableCell>
                                <TableCell>
                                    <img
                                        src={(product.smallThumbnailUrl != undefined )?product.smallThumbnailUrl:'https://placehold.co/50'}
                                        alt={product.name}
                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                    />
                                </TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.defaultDisplayedPriceFormatted}</TableCell>
                                <TableCell>
                                    <TextField
                                        type="number"
                                        defaultValue={product.quantity}
                                        onChange={(e) => {
                                            api.put(`/api/products/${product.id}/stock`, { stock: e.target.value })
                                                .then(() => alert('Stock updated'))
                                                .catch(error => console.error(error));
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)} sx={{ mt: 2, mr: 2 }}>
                Update Stock
            </Button>
            <Button variant="contained" color="error" onClick={deleteProduct} sx={{ mt: 2 }}>
                Delete
            </Button>

            <h2>Bundles</h2>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenBundleDialog(true)}
                sx={{ mb: 2 }}
            >
                Create Bundle
            </Button>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Products</TableCell>
                            <TableCell>Discount</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bundles.map(bundle => (
                            <TableRow key={bundle.id}>
                                <TableCell>{bundle.name}</TableCell>
                                <TableCell>
                                    {products
                                        .filter(p => bundle.product_ids.includes(p.id))
                                        .map(p => p.name)
                                        .join(', ')}
                                </TableCell>
                                <TableCell>{bundle.discount}%</TableCell>
                                <TableCell>
                                    <Button
                                        onClick={() => handleEditBundle(bundle)}
                                        color="primary"
                                    >
                                        EDIT
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteBundle(bundle.id)}
                                        color="error"
                                    >
                                        DELETE
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Update Stock</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Quantity"
                        type="number"
                        fullWidth
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleUpdateStock} color="primary">
                        Update Stock
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openBundleDialog}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{editMode ? 'Edit Bundle' : 'Create New Bundle'}</DialogTitle>
                <DialogContent>
                    <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
                        <Step>
                            <StepLabel>Select Products</StepLabel>
                        </Step>
                        <Step>
                            <StepLabel>Bundle Details</StepLabel>
                        </Step>
                    </Stepper>

                    {activeStep === 0 ? (
                        <ProductSelectionStep
                            products={filteredProducts}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            newBundle={newBundle}
                            setNewBundle={setNewBundle}
                        />
                    ) : (
                        <BundleDetailsStep
                            products={products}
                            newBundle={newBundle}
                            setNewBundle={setNewBundle}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    {activeStep > 0 && (
                        <Button onClick={handleBack}>Back</Button>
                    )}
                    {activeStep === 0 ? (
                        <Button onClick={handleNext} variant="contained" color="primary">
                            Next
                        </Button>
                    ) : (
                        <Button onClick={handleCreateOrUpdateBundle} variant="contained" color="primary">
                            {editMode ? 'Update Bundle' : 'Create Bundle'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default App;