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
    Box,
    Typography,
    Checkbox,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Badge,
    Chip
} from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // import styles for the editor

const Products = ({ api, isAuthenticated }) => {
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false); // State for Edit Dialog
    const [stockQuantity, setStockQuantity] = useState('');
    const [productToEdit, setProductToEdit] = useState(null); // State for the product being edited
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [filter, setFilter] = useState('all'); // Filter state
    const [updatedProductData, setUpdatedProductData] = useState({
        name: '',
        description: '',
        price: '',
        costPrice: '',
        stock: ''
    });

    useEffect(() => {
        if (isAuthenticated) {
            getProducts();
        }
    }, [isAuthenticated]);

    const getProducts = () => {
        setLoading(true);
        api.get('/api/products')
            .then(response => {
                setProducts(response.data.items);
                setLoading(false);
            })
            .catch(error => {
                setError('Failed to fetch products');
                setLoading(false);
            });
    };

    const handleSelectProduct = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    };

    const deleteProduct = () => {
        if (selectedProducts.length === 0) {
            alert('Please select products first');
            return;
        }
        if (confirm('Are you sure you want to delete these products?')) {
            setLoading(true);
            selectedProducts.forEach(productId => {
                api.delete(`/api/products/${productId}`)
                    .then(() => getProducts())
                    .catch(error => {
                        setError('Failed to delete product');
                        setLoading(false);
                    });
            });
        }
    };

    const handleUpdateStock = () => {
        const quantity = parseInt(stockQuantity);
        if (isNaN(quantity) || quantity < 0) {
            setError('Please enter a valid quantity.');
            return;
        }
        setUpdating(true);
        selectedProducts.forEach(productId => {
            api.put(`/api/products/${productId}/stock`, { stock: quantity })
                .then(() => {
                    setUpdating(false);
                    alert(`Stock updated for product id :${productId}`);
                    setOpenDialog(false);
                    getProducts();
                })
                .catch(error => {
                    setError('Failed to update stock');
                    setUpdating(false);
                    getProducts();
                });
        });
    };

    const handleEditProduct = (product) => {
        setProductToEdit(product);
        setUpdatedProductData({
            name: product.name,
            description: product.description || '',
            price: product.price || 0,
            stock: product.quantity || 0,
            costPrice: product.costPrice || 0
        });
        setOpenEditDialog(true);
    };

    const handleSaveProduct = () => {
        const { name, description, price, stock, costPrice } = updatedProductData;
        const updatedProduct = {
            name,
            description,
            price: parseFloat(price),
            costPrice: parseFloat(costPrice),
            stock: parseInt(stock)
        };

        api.put(`/api/products/${productToEdit.id}`, updatedProduct)
            .then(() => {
                setOpenEditDialog(false);
                getProducts();
                alert('Product updated successfully!');
            })
            .catch(error => {
                setError('Failed to update product');
                console.error(error);
            });
    };

    const renderLoader = () => {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <CircularProgress />
            </Box>
        );
    };

    const filteredProducts = products.filter(product => {
        if (filter === 'inStock') {
            return product.inStock === true;
        } else if (filter === 'outOfStock') {
            return product.inStock === false;
        }
        return true; // 'all' shows everything
    });

    return (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                    <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem' }}>
                        Products
                    </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                    {/* Filter Section */}
                    <FormControl fullWidth size="small">
                        <InputLabel>Stock Filter</InputLabel>
                        <Select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            label="Stock Filter"
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="inStock">In Stock</MenuItem>
                            <MenuItem value="outOfStock">Out of Stock</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {error && <Alert severity="error">{error}</Alert>}
            {loading && renderLoader()}

            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedProducts.length === filteredProducts.length}
                                    onChange={() => {
                                        if (selectedProducts.length === filteredProducts.length) {
                                            setSelectedProducts([]);
                                        } else {
                                            setSelectedProducts(filteredProducts.map(product => product.id));
                                        }
                                    }}
                                />
                            </TableCell>
                            <TableCell padding="none" align="center">ID</TableCell>
                            <TableCell padding="none">Image</TableCell>
                            <TableCell padding="none">Name</TableCell>
                            <TableCell padding="none">Price</TableCell>
                            <TableCell padding="none">Stock</TableCell>
                            <TableCell padding="none">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProducts.map(product => (
                            <TableRow
                                key={product.id}
                                sx={{
                                    backgroundColor: product.inStock === false ? '#f8d7da' : 'transparent',
                                    '&:hover': {
                                        backgroundColor: product.inStock === false ? '#f5c6cb' : '#f0f0f0',
                                    },
                                }}
                            >
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => handleSelectProduct(product.id)}
                                    />
                                </TableCell>
                                <TableCell padding="none" align="center">{product.id}<br/>
                                    {product.inStock === false && (
                                        <Chip
                                            label="Out of Stock"
                                            color="error"
                                            size="small"
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                </TableCell>
                                <TableCell padding="none">
                                    <img
                                        src={product.smallThumbnailUrl || 'https://placehold.co/50'}
                                        alt={product.name}
                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                    />
                                </TableCell>
                                <TableCell padding="none">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {product.name}
                                    </Box>
                                </TableCell>
                                <TableCell padding="none">{product.defaultDisplayedPriceFormatted}</TableCell>
                                <TableCell padding="none">
                                    <TextField
                                        type="number"
                                        size="small"
                                        defaultValue={product.quantity}
                                        onChange={(e) => {
                                            api.put(`/api/products/${product.id}/stock`, { stock: e.target.value })
                                                .then(() => {alert('Stock updated'); getProducts();})
                                                .catch(error => console.error(error));
                                        }}
                                        sx={{ maxWidth: 100 }}
                                    />
                                </TableCell>
                                <TableCell padding="none">
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => handleEditProduct(product)}
                                    >
                                        Edit
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenDialog(true)}
                    sx={{ mr: 2 }}
                    disabled={selectedProducts.length === 0}
                >
                    Update Stock
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={deleteProduct}
                    disabled={selectedProducts.length === 0}
                >
                    Delete
                </Button>
            </Box>

            {/* Update Stock Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Update Stock for Selected Products</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Stock Quantity"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                    />
                    <List>
                        {selectedProducts.map(productId => {
                            const product = products.find(p => p.id === productId);
                            return (
                                <ListItem key={productId}>
                                    <ListItemText
                                        primary={product?.name}
                                        secondary={`Current Stock: ${product?.quantity}`}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleUpdateStock} color="primary" variant="contained" disabled={updating}>
                        {updating ? <CircularProgress size={24} color="inherit" /> : 'Update Stock'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Product Dialog */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Product Name"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={updatedProductData.name}
                        onChange={(e) => setUpdatedProductData({ ...updatedProductData, name: e.target.value })}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <ReactQuill
                        value={updatedProductData.description}
                        onChange={(value) => setUpdatedProductData({ ...updatedProductData, description: value })}
                        placeholder="Enter product description"
                        theme="snow"
                        style={{ marginBottom: '16px' }}
                    />
                    <TextField
                        label="Price"
                        variant="outlined"
                        fullWidth
                        size="small"
                        type="number"
                        value={updatedProductData.price}
                        onChange={(e) => setUpdatedProductData({ ...updatedProductData, price: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Cost Price"
                        variant="outlined"
                        fullWidth
                        size="small"
                        type="number"
                        value={updatedProductData.costPrice}
                        onChange={(e) => setUpdatedProductData({ ...updatedProductData, costPrice: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Stock Quantity"
                        variant="outlined"
                        fullWidth
                        size="small"
                        type="number"
                        value={updatedProductData.stock}
                        onChange={(e) => setUpdatedProductData({ ...updatedProductData, stock: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditDialog(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleSaveProduct} color="primary" variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Products;
