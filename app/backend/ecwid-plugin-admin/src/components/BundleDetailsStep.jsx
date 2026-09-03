import React, { useState, useEffect } from "react";
import {
    Box,
    TextField,
    Typography,
    List,
    ListItem,
    ListItemText
} from "@mui/material";

const BundleDetailsStep = ({
                               products,
                               newBundle,
                               setNewBundle,
                               setValidationFunction
                           }) => {
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setValidationFunction(() => validateFields);
    }, [setValidationFunction, newBundle]);

    const validateFields = () => {
        let newErrors = {};
        if (!newBundle.name.trim()) newErrors.name = "Bundle name is required.";
        if (!newBundle.sku.trim()) newErrors.sku = "Product SKU is required.";
        if (!newBundle.discount || newBundle.discount <= 0 || newBundle.discount > 100) {
            newErrors.discount = "Discount must be between 1 and 100.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const totalPrice = products
        .filter(product => newBundle.productIds.includes(product.id))
        .reduce((sum, product) => sum + parseFloat(product.defaultDisplayedPriceFormatted.replace(/[^0-9.-]+/g, "")), 0);

    const totalPriceAfterDiscount = totalPrice * (1 - (newBundle.discount / 100));

    return (
        <Box sx={{ width: "100%" }}>
            <TextField
                label="Bundle Name"
                fullWidth
                value={newBundle.name}
                onChange={(e) => setNewBundle(prev => ({ ...prev, name: e.target.value }))}
                margin="normal"
                error={!!errors.name}
                helperText={errors.name}
            />
            <TextField
                label="Product SKU"
                fullWidth
                value={newBundle.sku}
                onChange={(e) => setNewBundle(prev => ({ ...prev, sku: e.target.value }))}
                margin="normal"
                error={!!errors.sku}
                helperText={errors.sku}
            />
            <TextField
                label="Discount Percentage"
                type="number"
                fullWidth
                value={newBundle.discount}
                onChange={(e) => setNewBundle(prev => ({ ...prev, discount: e.target.value }))}
                margin="normal"
                inputProps={{ min: 1, max: 100, step: 0.1 }}
                error={!!errors.discount}
                helperText={errors.discount}
            />

            <TextField
                label="Cost Price"
                type="number"
                fullWidth
                value={newBundle.costPrice}
                onChange={(e) => setNewBundle(prev => ({ ...prev, costPrice: e.target.value }))}
                margin="normal"
                inputProps={{ min: 0, step: 1 }}
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
                <Typography variant="h6" sx={{ mt: 2 }}>
                    Bundle Price: {totalPrice.toFixed(2)} / {totalPriceAfterDiscount.toFixed(2)}
                </Typography>
            </Box>
        </Box>


    );
};

export default BundleDetailsStep;
