import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControl, FormControlLabel, FormGroup, IconButton,
  InputLabel, MenuItem, Paper, Select, Snackbar, Switch, TextField, Typography,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import {useNavigate} from "react-router-dom";

const ProductOptionsManager = ({ api, productId }) => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]); // All stored options
  const [selectedOptions, setSelectedOptions] = useState([]); // Options selected for the product
  const [newOption, setNewOption] = useState({ name: '', type: 'single_choice', values: [''], default_value: '', required: false });
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  // Fetch stored options on component mount
  useEffect(() => {
    if (api) fetchStoredOptions();
  }, [api]);

  // Fetch options for the product if editing
  useEffect(() => {
    if (api && productId) fetchProductOptions();
  }, [api, productId]);

  // Fetch all stored options from the database
  const fetchStoredOptions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/options');
      setOptions(response.data);
    } catch (error) {
      console.error('Error fetching stored options:', error);
      setNotification({ open: true, message: 'Failed to load stored options', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch options for the product
  const fetchProductOptions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/products/${productId}/options`);
      setSelectedOptions(response.data);
    } catch (error) {
      console.error('Error fetching product options:', error);
      setNotification({ open: true, message: 'Failed to load product options', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Save product options
  const saveProductOptions = async () => {
    setLoading(true);
    try {
      const response = await api.put(`/api/products/${productId}/options`, { options: selectedOptions });
      if (response.status === 200) {
        setNotification({ open: true, message: 'Product options saved successfully', severity: 'success' });
      } else {
        throw new Error('Failed to save product options');
      }
    } catch (error) {
      console.error('Error saving product options:', error);
      setNotification({ open: true, message: 'Failed to save product options', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Add a new option to the stored options
  const handleAddOption = async () => {
    // Filter out any empty values
    const filteredValues = newOption.values.filter(val => val.trim() !== '');
    if (newOption.name.trim() === '' || filteredValues.length === 0) {
      setNotification({ open: true, message: 'Option name and at least one value are required', severity: 'error' });
      return;
    }
    try {
      const payload = { ...newOption, values: filteredValues };
      const response = await api.post('/api/options', payload);
      setOptions((prev) => [...prev, response.data]);
      setNewOption({ name: '', type: 'single_choice', values: [''], default_value: '', required: false });
      setOptionDialogOpen(false);
      setNotification({ open: true, message: 'Option added successfully', severity: 'success' });
    } catch (error) {
      console.error('Error adding option:', error);
      setNotification({ open: true, message: 'Failed to add option', severity: 'error' });
    }
  };

  // Edit an existing option
  const handleEditOption = (option) => {
    setEditingOption(option);
    // Ensure values is an array (if stored as a string, parse it)
    let valuesArray = option.values;
    if (typeof valuesArray === 'string') {
      try {
        valuesArray = JSON.parse(option.values);
      } catch (e) {
        valuesArray = option.values.split(',').map(v => v.trim());
      }
    }
    setNewOption({ ...option, values: valuesArray });
    setOptionDialogOpen(true);
  };

  // Update an existing option
  const handleUpdateOption = async () => {
    const filteredValues = newOption.values.filter(val => val.trim() !== '');
    if (newOption.name.trim() === '' || filteredValues.length === 0) {
      setNotification({ open: true, message: 'Option name and at least one value are required', severity: 'error' });
      return;
    }
    try {
      const payload = { ...newOption, values: filteredValues };
      const response = await api.put(`/api/options/${editingOption.id}`, payload);
      setOptions((prev) => prev.map((opt) => (opt.id === editingOption.id ? response.data : opt)));
      setEditingOption(null);
      setOptionDialogOpen(false);
      setNotification({ open: true, message: 'Option updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating option:', error);
      setNotification({ open: true, message: 'Failed to update option', severity: 'error' });
    }
  };

  // Remove an option from stored options
  const handleRemoveOption = async (id) => {
    try {
      await api.delete(`/api/options/${id}`);
      setOptions((prev) => prev.filter((opt) => opt.id !== id));
      setNotification({ open: true, message: 'Option removed successfully', severity: 'success' });
    } catch (error) {
      console.error('Error removing option:', error);
      setNotification({ open: true, message: 'Failed to remove option', severity: 'error' });
    }
  };

  // Add an option to the product
  const handleAddToProduct = (option) => {
    navigate('/packbundles');
  };
  // Handlers for dynamic option values
  const handleValueChange = (index, value) => {
    const newValues = [...newOption.values];
    newValues[index] = value;
    setNewOption({ ...newOption, values: newValues });
  };

  const handleAddNewValue = () => {
    setNewOption({ ...newOption, values: [...newOption.values, ''] });
  };

  const handleRemoveValue = (index) => {
    const newValues = newOption.values.filter((_, idx) => idx !== index);
    setNewOption({ ...newOption, values: newValues });
  };

  return (
      <Box sx={{ width: '100%' }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1">Product Options Manager</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
              setNewOption({ name: '', type: 'single_choice', values: [''], default_value: '', required: false });
              setEditingOption(null);
              setOptionDialogOpen(true);
            }}>
              Add New Option
            </Button>
          </Box>

          {/* Stored Options */}
          <Typography variant="h6" sx={{ mt: 2 }}>Bundle Options</Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Values</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {options.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell>{option.name}</TableCell>
                      <TableCell>{option.type}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {typeof option.values === 'string'
                              ? JSON.parse(option.values).map((value, i) => (
                                  <Chip key={i} label={value} size="small" />
                              ))
                              : option.values.map((value, i) => (
                                  <Chip key={i} label={value} size="small" />
                              ))
                          }
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditOption(option)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleRemoveOption(option.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                        <Button onClick={() => handleAddToProduct(option)}>Add to Product</Button>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        </Paper>

        {/* Add/Edit Option Dialog */}
        <Dialog open={optionDialogOpen} onClose={() => setOptionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingOption ? 'Edit Option' : 'Add New Option'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                  label="Option Name"
                  value={newOption.name}
                  onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                  fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Option Type</InputLabel>
                <Select
                    value={newOption.type}
                    onChange={(e) => setNewOption({ ...newOption, type: e.target.value })}
                    label="Option Type"
                >
                  <MenuItem value="single_choice">Single Choice</MenuItem>
                  <MenuItem value="multi_choice">Multi Choice</MenuItem>
                  <MenuItem value="dropdown">Dropdown</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                </Select>
              </FormControl>
              {/* Dynamic Option Values with Scroll */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Option Values</Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', borderRadius: 1, p: 1 }}>
                  {newOption.values.map((val, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TextField
                            label={`Value ${idx + 1}`}
                            value={val}
                            onChange={(e) => handleValueChange(idx, e.target.value)}
                            fullWidth
                        />
                        <IconButton onClick={() => handleRemoveValue(idx)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                  ))}
                </Box>
                <Button onClick={handleAddNewValue} variant="outlined" startIcon={<AddIcon />} sx={{ mt: 1 }}>
                  Add New Value
                </Button>
              </Box>
              <TextField
                  label="Default Value"
                  value={newOption.default_value}
                  onChange={(e) => setNewOption({ ...newOption, default_value: e.target.value })}
                  fullWidth
              />
              <FormControlLabel
                  control={<Switch checked={newOption.required} onChange={(e) => setNewOption({ ...newOption, required: e.target.checked })} />}
                  label="Required"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOptionDialogOpen(false)}>Cancel</Button>
            <Button onClick={editingOption ? handleUpdateOption : handleAddOption} variant="contained" color="primary">
              {editingOption ? 'Update Option' : 'Add Option'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification */}
        <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification({ ...notification, open: false })}>
          <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
  );
};

export default ProductOptionsManager;