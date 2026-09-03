import React, { useEffect, useState } from 'react'
import { Autocomplete, Box, Button, Checkbox, Chip, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import AssessmentIcon from '@mui/icons-material/Assessment';
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

function Report({ api, isAuthenticated }) {
    const [products, setProducts] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedBundles, setSelectedBundles] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isPending, setPending] = useState(false);
    const [searchBy, setSearchBy] = useState('products');

    useEffect(() => {
        if (isAuthenticated) {
            getProducts();
            getBundles()
        }

    }, [isAuthenticated]);

    const getProducts = async () => {
        try {
            const res = await api.get('/api/products');
            if (res && res.data) {
                setProducts(res.data.items.map(item => ({ id: item.id, name: item.name })))
            }
        } catch (err) {

        }
    }

    const getBundles = async () => {
        try {
            const res = await api.get('/api/bundles');
            if (res && res.data) {
                console.log(res)
                setBundles(res.data.items.map(item => ({ id: item.id, name: item.name })))
            }
        } catch (err) {

        }
    }

    const handleProductChange = (event, newValue) => {
        setSelectedProducts(newValue);
    };

    const handleBundleChange = (event, newValue) => {
        setSelectedBundles(newValue)
    }

    const searchOrders = async () => {
        setPending(true);
        setOrders([])
        try {
            const query = selectedProducts.map(item => item.id).toString()
            const res = await api.get(`/api/orders?products=${query}`);
            if (res && res.data) {
                setOrders(res.data.orders)
            }
        } catch (err) {

        }
        setPending(false)
    }


    return (
        <div>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Reports
                </Typography>
                <Grid container spacing={3} alignItems='center'>
                    <Grid item md={4}>
                        <FormControl fullWidth>
                            <InputLabel id="demo-simple-select-label">Search by</InputLabel>
                            <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={searchBy}
                                label="Search by"
                                onChange={e => setSearchBy(e.target.value)}
                            >
                                <MenuItem value={'products'}>Products</MenuItem>
                                <MenuItem value={'bundles'}>Bundles</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item md={4}>
                        {searchBy === 'products' ? <>
                            <Autocomplete
                                fullWidth
                                limitTags={3}
                                multiple
                                id="checkboxes-tags-demo"
                                options={products}
                                value={selectedProducts}
                                onChange={handleProductChange}
                                disableCloseOnSelect
                                getOptionLabel={(option) => option.name}
                                renderOption={(props, option, { selected }) => {
                                    const { key, ...optionProps } = props;
                                    return (
                                        <li key={key} {...optionProps}>
                                            <Checkbox
                                                icon={icon}
                                                checkedIcon={checkedIcon}
                                                style={{ marginRight: 8 }}
                                                checked={selected}
                                            />
                                            {option.name}
                                        </li>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select products to view orders" placeholder="" />
                                )}
                            />
                        </> :
                            <>
                                <Autocomplete
                                    limitTags={3}
                                    multiple
                                    id="checkboxes-tags-demo2"
                                    options={bundles}
                                    value={selectedBundles}
                                    onChange={handleBundleChange}
                                    disableCloseOnSelect
                                    getOptionLabel={(option) => option.name}
                                    renderOption={(props, option, { selected }) => {
                                        const { key, ...optionProps } = props;
                                        return (
                                            <li key={key} {...optionProps}>
                                                <Checkbox
                                                    icon={icon}
                                                    checkedIcon={checkedIcon}
                                                    style={{ marginRight: 8 }}
                                                    checked={selected}
                                                />
                                                {option.name}
                                            </li>
                                        );
                                    }}
                                    style={{ width: 500 }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Select bundles to view orders" placeholder="" />
                                    )}
                                />
                            </>}
                    </Grid>
                    <Grid item md={2}>
                        <Button disabled={isPending || selectedProducts.length === 0} onClick={searchOrders} color='info' size='large' endIcon={<AssessmentIcon />} variant="contained" >View Orders</Button>
                    </Grid>
                </Grid>
                <Grid>

                </Grid>
                <br />
                <Grid>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Number</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Customer Id</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Products</TableCell>
                                    <TableCell>Method</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>{order.id}</TableCell>
                                        <TableCell>{order.orderNumber}</TableCell>
                                        <TableCell>
                                            {new Date(order.createDate).toLocaleString()}
                                        </TableCell>
                                        <TableCell>{order.customerId}</TableCell>
                                        <TableCell>{order.email}</TableCell>
                                        <TableCell>
                                            <div>Sub Total: ${order.subtotal}</div>
                                            <div>Discount: ${order.discount}</div>
                                            <div>Tax: ${order.tax}</div>
                                            <div>Total: ${order.total}</div>

                                        </TableCell>
                                        <TableCell>
                                            <ul>
                                                {order.items.map(oi => <li key={oi.id}>
                                                    {oi.name} ({oi.quantity})
                                                </li>)}
                                            </ul>
                                        </TableCell>
                                        <TableCell>
                                            {order.paymentMethod}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={order.paymentStatus} color={
                                                order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'AWAITING_PAYMENT' ? 'secondary' : 'info'
                                            } />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {orders.length === 0 &&
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            Search to get results
                                        </TableCell>
                                    </TableRow>
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Box>
        </div>
    )
}

export default Report