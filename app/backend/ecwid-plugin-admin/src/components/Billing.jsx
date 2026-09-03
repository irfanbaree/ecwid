import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box,
    Typography, CircularProgress, Alert, Dialog, DialogActions, DialogContent, DialogTitle, TextField
} from '@mui/material';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const Billing = ({ api, isAuthenticated }) => {
    const stripe = useStripe();
    const elements = useElements();

    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [paymentDetails, setPaymentDetails] = useState({
        name: '',
        email: ''
    });

    useEffect(() => {
        if (isAuthenticated) fetchBills();
    }, [isAuthenticated]);

    const fetchBills = () => {
        setLoading(true);
        api.get('/api/billing')
            .then(response => setBills(response.data.bills))
            .catch(() => setError('Failed to fetch billing records'))
            .finally(() => setLoading(false));
    };

    const handlePay = async () => {
        if (!validatePaymentDetails()) return;
        setPaymentProcessing(true);

        if (!stripe || !elements) {
            setError('Stripe is not initialized.');
            setPaymentProcessing(false);
            return;
        }

        // Create a payment method using Stripe Elements
        const cardElement = elements.getElement(CardElement);
        const { paymentMethod, error } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: { name: paymentDetails.name, email: paymentDetails.email }
        });

        if (error) {
            setError(error.message);
            setPaymentProcessing(false);
            return;
        }

        // Send the PaymentMethod ID to the backend
        api.post(`/api/billing/${selectedBill.bill_id}/pay`, {
            paymentDetails: {
                name: paymentDetails.name,
                email: paymentDetails.email,
                paymentMethodId: paymentMethod.id
            }
        })
            .then(() => {
                setError(null);
                fetchBills();
                setSelectedBill(null);
            })
            .catch(() => setError('Payment failed'))
            .finally(() => setPaymentProcessing(false));
    };

    const validatePaymentDetails = () => {
        const { name, email } = paymentDetails;
        if (!name || !email) {
            setError('Name and email are required.');
            return false;
        }
        return true;
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem' }}>Billing</Typography>
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Bill ID</TableCell>
                                <TableCell>Transaction ID</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Alert severity="info">No bills found.</Alert>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bills.map(bill => (
                                    <TableRow key={bill.bill_id}>
                                        <TableCell>{bill.bill_id}</TableCell>
                                        <TableCell>{bill.trans_id}</TableCell>
                                        <TableCell>{bill.status}</TableCell>
                                        <TableCell>{bill.due_date}</TableCell>
                                        <TableCell>${bill.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            {bill.status === 'Pending' && (
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    disabled={paymentProcessing}
                                                    onClick={() => {
                                                        setSelectedBill(bill);
                                                        setPaymentDetails({ name: '', email: '' });
                                                    }}
                                                >
                                                    Pay
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Payment Dialog */}
            <Dialog open={Boolean(selectedBill)} onClose={() => setSelectedBill(null)}>
                <DialogTitle>Enter Payment Details</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth label="Name" variant="outlined" margin="dense"
                        value={paymentDetails.name} onChange={(e) => setPaymentDetails({ ...paymentDetails, name: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Email" variant="outlined" margin="dense"
                        value={paymentDetails.email} onChange={(e) => setPaymentDetails({ ...paymentDetails, email: e.target.value })}
                    />
                    <Box sx={{ mt: 2 }}>
                        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedBill(null)} color="secondary">Cancel</Button>
                    <Button onClick={handlePay} color="primary" variant="contained" disabled={paymentProcessing}>
                        {paymentProcessing ? <CircularProgress size={24} /> : 'Confirm Payment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Billing;