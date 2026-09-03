import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stepper,
    Step,
    StepLabel,
    Typography,
    Box,
    Badge,
    Chip,
} from '@mui/material';
import ProductSelectionStep from './ProductSelectionStep';
import BundleDetailsStep from './BundleDetailsStep';
import BundleImageSelectionStep from './BundleImageSelectionStep';

const Bundles = ({ api, isAuthenticated }) => {
    const [products, setProducts] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [openBundleDialog, setOpenBundleDialog] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [newBundle, setNewBundle] = useState({
        id: null,
        name: '',
        productIds: [],
        discount: '',
        sku: '',
        mainImage: '',
        bundleImages: [],
    });
    const [editMode, setEditMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            getBundles();
            getProducts();
        }
    }, [isAuthenticated]);

    const [validationFunction, setValidationFunction] = useState(null);

    const getBundles = () => {
        api.get('/api/bundles')
            .then(response => setBundles(response.data.bundles))
            .catch(error => console.error(error));
    };

    const getProducts = () => {
        api.get('/api/products')
            .then(response => {
                setProducts(response.data.items);
            })
            .catch(error => console.error(error));
    };

    const handleCreateOrUpdateBundle = () => {
        const method = editMode ? 'put' : 'post';
        const url = editMode ? `/api/bundles/${newBundle.id}` : '/api/bundles';

        api[method](url, {
            name: newBundle.name,
            productIds: newBundle.productIds,
            discount: parseFloat(newBundle.discount),
            costPrice: parseFloat(newBundle.costPrice),
            sku: newBundle.sku,
            mainImage: newBundle.mainImage, // Include main image
            bundleImages: newBundle.bundleImages, // Include gallery images
        })
            .then(response => {
                if (editMode) {
                    setBundles(bundles.map(b => (b.id === newBundle.id ? response.data : b)));
                } else {
                    setBundles([...bundles, response.data]);
                }
                handleClose();
            })
            .catch(error => console.error(error));
    };

    const handleDeleteBundle = (bundleId) => {
        if (confirm('Are you sure you want to delete this bundle?')) {
            api.delete(`/api/bundles/${bundleId}`)
                .then(() => setBundles(bundles.filter(b => b.id !== bundleId)))
                .catch(error => console.error(error));
        }
    };

    const handleEditBundle = (bundle) => {
        setNewBundle({
            id: bundle.id,
            name: bundle.name,
            productIds: typeof bundle.product_ids === "string" ? JSON.parse(bundle.product_ids) : (Array.isArray(bundle.product_ids) ? bundle.product_ids : []),
            discount: bundle.discount,
            costPrice: bundle.costPrice,
            sku: bundle.sku,
            mainImage: bundle.mainImage || '',
            bundleImages: bundle.bundleImages || [],
        });
        setEditMode(true);
        setOpenBundleDialog(true);
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
            costPrice: 0,
            sku: '',
            mainImage: '',
            bundleImages: [],
        });
        setEditMode(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Bundles
            </Typography>
            <Button variant="contained" color="primary" onClick={() => setOpenBundleDialog(true)} sx={{ mb: 2 }}>
                Create Bundle
            </Button>
            <TableContainer component={Paper}>
                <Table sx={{ '& td, & th': { padding: '8px' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Products</TableCell>
                            <TableCell>Discount</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody >
                        {bundles.map(bundle => (
                            <TableRow key={bundle.id} sx={{ height: '40px' , backgroundColor: products.some(p => p.id === bundle.ecwid_id && !p.inStock) ? '#ffebee' : 'inherit' }}>
                                <TableCell>{bundle.name}</TableCell>
                                <TableCell>
                                    {products
                                        .filter(p => bundle.product_ids.includes(p.id))
                                        .map(p => (
                                            <Box key={p.id} sx={{ display: 'block', marginRight: '8px' }}>
                                                <img style={{verticalAlign: 'middle'}} src={p.smallThumbnailUrl || 'https://placehold.co/50'} alt={p.name} width="40" height="40" />
                                                {p.name} - <Chip
                                                label={p.quantity}
                                                color={p.inStock?'success':'error'}
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                            </Box>
                                        ))}
                                </TableCell>
                                <TableCell>{bundle.discount}%</TableCell>
                                <TableCell>{products
                                    .filter(p => p.id === bundle.ecwid_id) // Match bundle.ecwid_id with product.id
                                    .map(p => p.defaultDisplayedPriceFormatted) // Extract the price
                                    .join(', ')}</TableCell>
                                <TableCell>
                                    <Button onClick={() => handleEditBundle(bundle)} color="primary">
                                        EDIT
                                    </Button>
                                    <Button onClick={() => handleDeleteBundle(bundle.id)} color="error">
                                        DELETE
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* BUNDLE CREATION DIALOG */}
            <Dialog open={openBundleDialog} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{editMode ? 'Edit Bundle' : 'Create New Bundle'}</DialogTitle>
                <DialogContent>
                    <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
                        <Step>
                            <StepLabel>Select Products</StepLabel>
                        </Step>
                        <Step>
                            <StepLabel>Bundle Details</StepLabel>
                        </Step>
                        <Step>
                            <StepLabel>Select Images</StepLabel>
                        </Step>
                    </Stepper>

                    {activeStep === 0 && (
                        <ProductSelectionStep
                            products={products}
                            newBundle={newBundle}
                            setNewBundle={setNewBundle}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                        />
                    )}
                    {activeStep === 1 && (
                        <BundleDetailsStep
                            products={products}
                            newBundle={newBundle}
                            setNewBundle={setNewBundle}
                            api={api}
                            activeStep={activeStep}
                            setValidationFunction={setValidationFunction}
                        />
                    )}
                    {activeStep === 2 && (
                        <BundleImageSelectionStep
                            products={products}
                            newBundle={newBundle}
                            setNewBundle={setNewBundle}
                            api={api}
                        />
                    )}
                </DialogContent>

                {/* UPDATED BUTTON LOGIC */}
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    {activeStep > 0 && <Button onClick={() => setActiveStep(activeStep - 1)}>Back</Button>}
                    {activeStep < 2 ? (
                        <Button
                            onClick={() => {
                                if (activeStep === 1) {
                                    // Only validate on the first step
                                    if (validationFunction && validationFunction()) {
                                        setActiveStep(activeStep + 1);
                                    }
                                } else {
                                    setActiveStep(activeStep + 1);
                                }
                            }}
                            variant="contained"
                            color="primary"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button onClick={handleCreateOrUpdateBundle} variant="contained" color="primary">
                            {editMode ? 'Update Bundle' : 'Create Bundle'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Bundles;