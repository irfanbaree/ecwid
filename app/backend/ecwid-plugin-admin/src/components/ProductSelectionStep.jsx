import React from 'react';
import { Box, List, ListItem, ListItemText, Checkbox, TextField } from '@mui/material';

const ProductSelectionStep = ({ products, newBundle, setNewBundle, searchQuery, setSearchQuery }) => {
    // Filter products based on search query
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ width: '100%' }}>
            <TextField
                fullWidth
                label="Search Products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                margin="normal"
            />
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {filteredProducts.map((product) => (
                    <ListItem key={product.id} divider>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <img
                                src={product.smallThumbnailUrl || 'https://placehold.co/50'}
                                alt={product.name}
                                style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '16px' }}
                            />
                            <ListItemText
                                primary={product.name}
                                secondary={`Price: ${product.defaultDisplayedPriceFormatted}`}
                            />
                            <Checkbox
                                checked={newBundle.productIds.includes(product.id)}
                                onChange={() => {
                                    setNewBundle(prev => ({
                                        ...prev,
                                        productIds: prev.productIds.includes(product.id)
                                            ? prev.productIds.filter(id => id !== product.id)
                                            : [...prev.productIds, product.id],
                                    }));
                                }}
                            />
                        </Box>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default ProductSelectionStep;