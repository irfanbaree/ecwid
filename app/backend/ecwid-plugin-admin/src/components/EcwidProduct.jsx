import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// VariationDialog Component – handles both add and edit variation actions.
// It expects variation.options to be an array of objects like { name: 'Option Name', value: 'Choice' }.
const VariationDialog = ({ open, onClose, onSave, variation, productOptions }) => {
  // We'll use a dictionary for options internally.
  const [variationData, setVariationData] = useState({
    sku: '',
    price: 0,
    quantity: 0,
    weight: 0,
    options: {},
    wholesalePrices: [{ quantity: 0, price: 0 }],
    enabled: true
  });

  // Helper to convert options array to a dictionary.
  const optionsArrayToDict = (optionsArray) => {
    const dict = {};
    optionsArray.forEach(item => {
      dict[item.name] = item.value;
    });
    return dict;
  };

  // Helper to convert dictionary back to an array.
  const dictToOptionsArray = (dict) => {
    return Object.entries(dict).map(([name, value]) => ({ name, value }));
  };

  useEffect(() => {
    if (variation) {
      // Convert existing options array into a dictionary.
      setVariationData({
        sku: variation.sku || '',
        price: variation.price || 0,
        quantity: variation.quantity || 0,
        weight: variation.weight || 0,
        options: variation.options ? optionsArrayToDict(variation.options) : {},
        enabled: variation.enabled !== undefined ? variation.enabled : true,
        wholesalePrices: variation.wholesalePrices || [{ quantity: 0, price: 0 }],
      });
    } else {
      // For new variations, default each option to the first available choice (or empty if none).
      const defaultOptions = {};
      productOptions.forEach(opt => {
        if (opt.choices && opt.choices.length > 0) {
          defaultOptions[opt.name] = typeof opt.choices[0] === 'object' ? opt.choices[0].text : opt.choices[0];
        } else {
          defaultOptions[opt.name] = '';
        }
      });
      setVariationData({
        sku: '',
        price: 0,
        quantity: 0,
        weight: 0,
        options: defaultOptions,
        enabled: true,
        wholesalePrices: [{ quantity: 0, price: 0 }],
      });
    }
  }, [variation, productOptions]);

  const handleFieldChange = (field, value) => {
    setVariationData(prev => ({ ...prev, [field]: value }));
  };

  // Add handlers for wholesale prices
  const handleWholesalePriceChange = (index, field, value) => {
    const updatedPrices = [...variationData.wholesalePrices];
    updatedPrices[index][field] = Number(value);
    setVariationData(prev => ({ ...prev, wholesalePrices: updatedPrices }));
  };

  const addWholesalePriceRow = () => {
    setVariationData(prev => ({
      ...prev,
      wholesalePrices: [...prev.wholesalePrices, { quantity: 0, price: 0 }]
    }));
  };

  const removeWholesalePriceRow = (index) => {
    const updatedPrices = variationData.wholesalePrices.filter((_, i) => i !== index);
    setVariationData(prev => ({ ...prev, wholesalePrices: updatedPrices }));
  };

  const handleOptionChange = (optionName, value) => {
    setVariationData(prev => ({
      ...prev,
      options: { ...prev.options, [optionName]: value }
    }));
  };

  const handleSave = () => {
    const validWholesalePrices = variationData.wholesalePrices.filter(
        p => p.quantity > 0 && p.price > 0
    );

    // Convert options dictionary back to array before sending.
    const optionsArray = dictToOptionsArray(variationData.options);
    onSave({ ...variationData, options: optionsArray, wholesalePrices: validWholesalePrices });
  };

  return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{variation ? "Edit Variation" : "Add Variation"}</DialogTitle>
        <DialogContent>
          {/* Two-column layout */}
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            {/* Left column: Option dropdowns */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {productOptions.map((opt, index) => (
                  <FormControl fullWidth key={index}>
                    <InputLabel>{opt.name}</InputLabel>
                    <Select
                        value={variationData.options[opt.name] || ''}
                        label={opt.name}
                        onChange={(e) => handleOptionChange(opt.name, e.target.value)}
                    >
                      {/* Allow empty selection */}
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {opt.choices.map((choice, idx) => {
                        const choiceValue = typeof choice === 'object' ? choice.text : choice;
                        return (
                            <MenuItem key={idx} value={choiceValue}>
                              {choiceValue}
                            </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
              ))}
            </Box>
            {/* Right column: Other fields */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                  label="SKU"
                  value={variationData.sku}
                  onChange={(e) => handleFieldChange('sku', e.target.value)}
                  fullWidth
              />
              <TextField
                  label="Price"
                  type="number"
                  value={variationData.price}
                  onChange={(e) => handleFieldChange('price', parseFloat(e.target.value))}
                  fullWidth
              />
              <TextField
                  label="Quantity"
                  type="number"
                  value={variationData.quantity}
                  onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value))}
                  fullWidth
              />
              <TextField
                  label="Weight (kg)"
                  type="number"
                  value={variationData.weight}
                  onChange={(e) => handleFieldChange('weight', parseFloat(e.target.value))}
                  fullWidth
              />
              <FormControlLabel
                  control={
                    <Switch
                        checked={variationData.enabled}
                        onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                    />
                  }
                  label="Enabled"
              />


              <Box sx={{
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: 1,
                p: 2,
                mt: 1,
                backgroundColor: 'background.paper'
              }}>
                <Typography variant="subtitle2" gutterBottom>
                  Wholesale Pricing
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 1 }}>
                  {variationData.wholesalePrices.map((price, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                            label="Min Qty"
                            type="number"
                            value={price.quantity}
                            onChange={(e) => handleWholesalePriceChange(index, 'quantity', e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Price"
                            type="number"
                            value={price.price}
                            onChange={(e) => handleWholesalePriceChange(index, 'price', e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <IconButton
                            onClick={() => removeWholesalePriceRow(index)}
                            size="small"
                            disabled={variationData.wholesalePrices.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                  ))}
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addWholesalePriceRow}
                    fullWidth
                >
                  Add Price Tier
                </Button>
              </Box>
            </Box>
          </Box>


        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
            {variation ? "Save Variation" : "Add Variation"}
          </Button>
        </DialogActions>
      </Dialog>
  );
};

// Main EcwidProduct Component – includes products, options, variations and wholesale pricing management.
const EcwidProduct = ({ api, isAuthenticated }) => {
  // State variables.
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [variations, setVariations] = useState([]);
  const [wholesalePrices, setWholesalePrices] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [newOption, setNewOption] = useState({ name: '', type: 'SELECT', choices: [''] });
  const [newDiscount, setNewDiscount] = useState({ quantity: 0, price: 0 });
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [storeOptions, setStoreOptions] = useState([]);
  const [selectedStoreOption, setSelectedStoreOption] = useState("");
  const [editingOption, setEditingOption] = useState(null);
  const [editingOptionIndex, setEditingOptionIndex] = useState(-1);
  const [editOptionDialogOpen, setEditOptionDialogOpen] = useState(false);

  // Variation dialog state.
  const [variationDialogOpen, setVariationDialogOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState(null);

  // Fetch products and store options on mount.
  useEffect(() => {
    if (api && isAuthenticated) {
      fetchProducts();
      fetchStoreOptions();
    }
  }, [api, isAuthenticated]);

  const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/products');
      setProducts(response.data.items);
      setNotification({ open: true, message: 'Products loaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error fetching products:', error);
      setNotification({ open: true, message: 'Failed to load products', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreOptions = async () => {
    try {
      const response = await api.get('/api/options');
      setStoreOptions(response.data);
    } catch (error) {
      console.error("Error fetching store options:", error);
    }
  };

  const handleProductSelect = async (productId) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/product/${productId}`);
      const product = response.data;
      setSelectedProduct(product);
      setProductOptions(product.options || []);
      setVariations(product.combinations || []);
      setWholesalePrices(product.wholesalePrices || []);
      setActiveTab(0);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setNotification({ open: true, message: 'Failed to load product details', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveProductOptions = async () => {
    setLoading(true);
    try {
      const response = await api.put(`/api/product/${selectedProduct.id}`, { options: productOptions });
      if (response.status === 200) {
        setNotification({ open: true, message: 'Product options saved successfully', severity: 'success' });
        handleProductSelect(selectedProduct.id);
      } else {
        throw new Error('Failed to save options');
      }
    } catch (error) {
      console.error('Error saving product options:', error);
      setNotification({ open: true, message: 'Failed to save product options', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveProductVariations = async () => {
    setLoading(true);
    try {

      const variations_updated = variations.map(variation => ({
        ...variation,
        options: variation.options?.filter(option => option.value?.trim() !== "")
      }));

      const response = await api.put(`/api/product/${selectedProduct.id}/combinations`, { combinations: variations_updated });
      if (response.status === 200) {
        setNotification({ open: true, message: 'Product variations saved successfully', severity: 'success' });
        handleProductSelect(selectedProduct.id);
      } else {
        throw new Error('Failed to save variations');
      }
    } catch (error) {
      console.error('Error saving product variations:', error);
      setNotification({ open: true, message: 'Failed to save product variations', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveWholesalePrices = async () => {
    setLoading(true);
    try {
      const response = await api.put(`/api/product/${selectedProduct.id}/wholesale`, { wholesalePrices: wholesalePrices });
      if (response.status === 200) {
        setNotification({ open: true, message: 'Wholesale prices saved successfully', severity: 'success' });
        handleProductSelect(selectedProduct.id);
      } else {
        throw new Error('Failed to save wholesale prices');
      }
    } catch (error) {
      console.error('Error saving wholesale prices:', error);
      setNotification({ open: true, message: 'Failed to save wholesale prices', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiscount = () => {
    if (newDiscount.quantity <= 0 || newDiscount.price <= 0) {
      setNotification({ open: true, message: 'Quantity and price must be greater than zero', severity: 'error' });
      return;
    }
    setWholesalePrices([...wholesalePrices, newDiscount]);
    setNewDiscount({ quantity: 0, price: 0 });
    setDiscountDialogOpen(false);
    setNotification({ open: true, message: 'Wholesale price added successfully', severity: 'success' });
  };

  // Option dialog handlers.
  const handleNewOptionChoiceChange = (index, value) => {
    const updatedChoices = [...newOption.choices];
    if (typeof updatedChoices[index] === 'object') {
      updatedChoices[index] = { ...updatedChoices[index], text: value, textTranslated: { en: value } };
    } else {
      updatedChoices[index] = { text: value, textTranslated: { en: value }, priceModifier: 0, priceModifierType: 'ABSOLUTE' };
    }
    setNewOption({ ...newOption, choices: updatedChoices });
  };

  const handleNewOptionPriceModifierChange = (index, value) => {
    const updatedChoices = [...newOption.choices];
    if (typeof updatedChoices[index] === 'object') {
      updatedChoices[index] = { ...updatedChoices[index], priceModifier: value };
    } else {
      updatedChoices[index] = { text: updatedChoices[index], textTranslated: { en: updatedChoices[index] }, priceModifier: value, priceModifierType: 'ABSOLUTE' };
    }
    setNewOption({ ...newOption, choices: updatedChoices });
  };

  const handleNewOptionAddChoice = () => {
    setNewOption({ ...newOption, choices: [...newOption.choices, ''] });
  };

  const handleNewOptionRemoveChoice = (index) => {
    const updatedChoices = [...newOption.choices];
    updatedChoices.splice(index, 1);
    let updatedDefaultChoice = newOption.defaultChoice;
    if (updatedDefaultChoice >= updatedChoices.length) {
      updatedDefaultChoice = 0;
    }
    setNewOption({ ...newOption, choices: updatedChoices, defaultChoice: updatedDefaultChoice });
  };

  const handleAddOption = () => {
    if (newOption.name.trim() === '') {
      setNotification({ open: true, message: 'Option name cannot be empty', severity: 'error' });
      return;
    }
    const transformedChoices = newOption.choices.map(choice =>
        typeof choice === 'object'
            ? {
              text: choice.text,
              textTranslated: { en: choice.text },
              priceModifier: choice.priceModifier || 0,
              priceModifierType: choice.priceModifierType || 'ABSOLUTE'
            }
            : { text: choice, textTranslated: { en: choice }, priceModifier: 0, priceModifierType: 'ABSOLUTE' }
    );
    const updatedNewOption = { ...newOption, choices: transformedChoices, nameTranslated: { en: newOption.name } };
    setProductOptions([...productOptions, updatedNewOption]);
    setNewOption({ name: '', type: 'SELECT', choices: [''], defaultChoice: 0, required: false, nameTranslated: { en: '' } });
    setSelectedStoreOption("");
    setOptionDialogOpen(false);
    setNotification({ open: true, message: 'Option added successfully', severity: 'success' });
  };

  const handleRemoveOption = (index) => {
    const updatedOptions = [...productOptions];
    updatedOptions.splice(index, 1);
    setProductOptions(updatedOptions);
  };

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...productOptions];
    updatedOptions[index][field] = value;
    if (field === 'name') {
      if (!updatedOptions[index].nameTranslated) {
        updatedOptions[index].nameTranslated = { en: value };
      } else {
        updatedOptions[index].nameTranslated.en = value;
      }
    }
    setProductOptions(updatedOptions);
  };

  const handleAddChoice = (optionIndex) => {
    const updatedOptions = [...productOptions];
    updatedOptions[optionIndex].choices.push({
      text: '',
      textTranslated: { en: '' },
      priceModifier: 0,
      priceModifierType: 'ABSOLUTE'
    });
    setProductOptions(updatedOptions);
  };

  const handleRemoveChoice = (optionIndex, choiceIndex) => {
    const updatedOptions = [...productOptions];
    updatedOptions[optionIndex].choices.splice(choiceIndex, 1);
    if (updatedOptions[optionIndex].defaultChoice >= updatedOptions[optionIndex].choices.length) {
      updatedOptions[optionIndex].defaultChoice = 0;
    }
    setProductOptions(updatedOptions);
  };

  const handleSetDefaultChoice = (optionIndex, choiceIndex) => {
    const updatedOptions = [...productOptions];
    updatedOptions[optionIndex].defaultChoice = choiceIndex;
    setProductOptions(updatedOptions);
  };

  const handleOpenOptionDialog = (optionIndex) => {
    setEditingOption({ ...productOptions[optionIndex] });
    setEditingOptionIndex(optionIndex);
    setEditOptionDialogOpen(true);
  };

  const handleSaveEditedOption = () => {
    const updatedOptions = [...productOptions];
    updatedOptions[editingOptionIndex] = editingOption;
    setProductOptions(updatedOptions);
    setEditOptionDialogOpen(false);
  };

  const handleDeleteVariation = (index) => {
    const updatedVariations = [...variations];
    updatedVariations.splice(index, 1);
    setVariations(updatedVariations);
    setNotification({ open: true, message: 'Variation deleted successfully', severity: 'success' });
  };

  return (
      <Box sx={{ width: '100%' }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1">
              Ecwid Product Manager
            </Typography>
            <Box>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchProducts} disabled={loading} sx={{ mr: 1 }}>
                Refresh Products
              </Button>
            </Box>
          </Box>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Product</InputLabel>
            <Select
                value={selectedProduct ? selectedProduct.id : ''}
                onChange={(e) => handleProductSelect(e.target.value)}
                label="Select Product"
                disabled={loading}
            >
              {/* Search input - now clickable */}
              <MenuItem
                  onClick={(e) => e.stopPropagation()} // Keep menu open when clicking
                  sx={{ '&:hover': { background: 'transparent' }, cursor: 'default' }}
              >
                <TextField
                    label="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    fullWidth
                    onClick={(e) => e.stopPropagation()} // Prevent menu close
                    sx={{
                      '& .MuiInputBase-root': { cursor: 'text' },
                      '& .Mui-focused': { fieldset: { borderColor: 'primary.main' } }
                    }}
                />
              </MenuItem>

              {/* Filtered results */}
              {filteredProducts.length === 0 ? (
                  <MenuItem disabled>No matching products found</MenuItem>
              ) : (
                  filteredProducts.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name}
                      </MenuItem>
                  ))
              )}
            </Select>
          </FormControl>
          {selectedProduct && (
              <>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Product Options" />
                    <Tab label="Variations" />
                    <Tab label="Wholesale Prices" />
                  </Tabs>
                </Box>
                {activeTab === 0 && (
                    <Box sx={{ pt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Product Options</Typography>
                        <Box>
                          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOptionDialogOpen(true)} sx={{ mr: 1 }}>
                            Add Option
                          </Button>
                          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={saveProductOptions} disabled={loading}>
                            Save Options
                          </Button>
                        </Box>
                      </Box>
                      {productOptions.length === 0 ? (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            No options defined. Add options to create product variations.
                          </Alert>
                      ) : (
                          productOptions.map((option, optionIndex) => (
                              <Card key={optionIndex} sx={{ mb: 2 }}>
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography variant="subtitle1">{option.name}</Typography>
                                      {option.required && <Chip label="Required" color="primary" size="small" sx={{ ml: 1 }} />}
                                    </Box>
                                    <Box>
                                      <IconButton onClick={() => handleOpenOptionDialog(optionIndex)}>
                                        <EditIcon />
                                      </IconButton>
                                      <IconButton onClick={() => handleRemoveOption(optionIndex)} color="error">
                                        <DeleteIcon />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField label="Option Name" value={option.name} onChange={(e) => handleOptionChange(optionIndex, 'name', e.target.value)} fullWidth />
                                    <FormControl fullWidth>
                                      <InputLabel>Option Type</InputLabel>
                                      <Select value={option.type} onChange={(e) => handleOptionChange(optionIndex, 'type', e.target.value)} label="Option Type">
                                        <MenuItem value="SELECT">Dropdown</MenuItem>
                                        <MenuItem value="RADIO">Radio Button</MenuItem>
                                        <MenuItem value="COLOR">Color Swatch</MenuItem>
                                        <MenuItem value="SIZE">Size</MenuItem>
                                      </Select>
                                    </FormControl>
                                    <FormControlLabel
                                        control={<Switch checked={option.required} onChange={(e) => handleOptionChange(optionIndex, 'required', e.target.checked)} />}
                                        label="Required Option"
                                    />
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle2">Choices</Typography>
                                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell>Default</TableCell>
                                            <TableCell>Text</TableCell>
                                            <TableCell>Price Modifier</TableCell>
                                            <TableCell>Actions</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {option.choices.map((choice, choiceIndex) => (
                                              <TableRow key={choiceIndex}>
                                                <TableCell>
                                                  <Radio checked={option.defaultChoice === choiceIndex} onChange={() => handleSetDefaultChoice(optionIndex, choiceIndex)} />
                                                </TableCell>
                                                <TableCell>
                                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {choice.text}
                                                    {option.type === 'COLOR' && choice.text && (
                                                        <Box sx={{ width: 20, height: 20, backgroundColor: choice.text, borderRadius: '50%', ml: 1, border: '1px solid #ddd' }} />
                                                    )}
                                                  </Box>
                                                </TableCell>
                                                <TableCell>
                                                  {choice.priceModifier > 0 ? (
                                                      <Typography color="primary">
                                                        +{choice.priceModifier}{choice.priceModifierType === 'PERCENT' ? '%' : ''}
                                                      </Typography>
                                                  ) : choice.priceModifier < 0 ? (
                                                      <Typography color="error">
                                                        {choice.priceModifier}{choice.priceModifierType === 'PERCENT' ? '%' : ''}
                                                      </Typography>
                                                  ) : (
                                                      '—'
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  <IconButton size="small" color="error" onClick={() => handleRemoveChoice(optionIndex, choiceIndex)} disabled={option.choices.length <= 1}>
                                                    <DeleteIcon fontSize="small" />
                                                  </IconButton>
                                                </TableCell>
                                              </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                    <Button startIcon={<AddIcon />} onClick={() => handleAddChoice(optionIndex)} size="small" sx={{ alignSelf: 'flex-start' }}>
                                      Add Choice
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>
                          ))
                      )}
                    </Box>
                )}
                {activeTab === 1 && (
                    <Box sx={{ pt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Product Variations</Typography>
                        <Box>
                          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingVariation(null); setVariationDialogOpen(true); }} sx={{ mr: 1 }}>
                            Add Variation
                          </Button>
                          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={saveProductVariations} disabled={loading || variations.length === 0}>
                            Save Variations
                          </Button>
                        </Box>
                      </Box>
                      {variations.length === 0 ? (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            No variations defined. Add variations manually.
                          </Alert>
                      ) : (
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Variation #</TableCell>
                                  <TableCell sx={{ width: '20%' }}>Options</TableCell>
                                  <TableCell>SKU</TableCell>
                                  <TableCell>Weight, kg</TableCell>
                                  <TableCell>Stock</TableCell>
                                  <TableCell>Price</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {variations.map((variation, index) => (
                                    <TableRow key={index}>
                                      <TableCell>#{variation.id || index + 1}</TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {productOptions.map((option, optIndex) => {
                                            const selectedOption = variation.options && variation.options.find(opt => opt.name === option.name);
                                            const selectedChoice = selectedOption ? selectedOption.value : 'any';
                                            return (
                                                <Chip key={optIndex} label={`${option.name}: ${selectedChoice}`} size="small" sx={{ display: 'block', width: '100%' }} />
                                            );
                                          })}
                                        </Box>
                                      </TableCell>
                                      <TableCell>{variation.sku}</TableCell>
                                      <TableCell>{variation.weight}</TableCell>
                                      <TableCell>
                                        {variation.quantity > 0 ? (
                                            <Typography variant="body1" component="span" sx={{ color: '#0dcb0d' }}>In stock</Typography>
                                        ) : 'outofstock'}
                                      </TableCell>
                                      <TableCell>{variation.price}</TableCell>
                                      <TableCell>
                                        <IconButton onClick={() => { setEditingVariation(variation); setVariationDialogOpen(true); }} color="primary" size="small">
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDeleteVariation(index)} color="error" size="small">
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                      )}
                    </Box>
                )}
                {activeTab === 2 && (
                    <Box sx={{ pt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Wholesale Prices</Typography>
                        <Box>
                          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDiscountDialogOpen(true)} sx={{ mr: 1 }}>
                            Add Price
                          </Button>
                          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={saveWholesalePrices} disabled={loading}>
                            Save Prices
                          </Button>
                        </Box>
                      </Box>
                      {wholesalePrices.length === 0 ? (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            No wholesale prices defined. Add wholesale pricing.
                          </Alert>
                      ) : (
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Minimum Quantity</TableCell>
                                  <TableCell>Price</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {wholesalePrices.map((priceObj, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{priceObj.quantity}+</TableCell>
                                      <TableCell>${priceObj.price}</TableCell>
                                      <TableCell>
                                        <IconButton
                                            onClick={() => {
                                              const updatedPrices = [...wholesalePrices];
                                              updatedPrices.splice(index, 1);
                                              setWholesalePrices(updatedPrices);
                                            }}
                                            color="error"
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                      )}
                    </Box>
                )}
              </>
          )}
        </Paper>
        {/* Add Option Dialog */}
        <Dialog open={optionDialogOpen} onClose={() => setOptionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Option</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Store Option (Optional)</InputLabel>
                <Select
                    value={selectedStoreOption}
                    onChange={(e) => {
                      const storeOptionId = e.target.value;
                      setSelectedStoreOption(storeOptionId);
                      const storeOptionData = storeOptions.find(o => o.id === storeOptionId);
                      if (storeOptionData) {
                        try {
                          const parsed = JSON.parse(storeOptionData.values);
                          const choicesArr = Array.isArray(parsed)
                              ? parsed.map(item => (typeof item === 'object' ? item.name || '' : item))
                              : [];
                          setNewOption(prev => ({ ...prev, choices: choicesArr }));
                        } catch (err) {
                          const choicesArr = storeOptionData.values.split(',').map(s => s.trim());
                          setNewOption(prev => ({ ...prev, choices: choicesArr }));
                        }
                      }
                    }}
                    label="Store Option (Optional)"
                >
                  {storeOptions.map(o => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.name}
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Option Name" value={newOption.name} onChange={(e) => setNewOption({ ...newOption, name: e.target.value })} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Option Type</InputLabel>
                <Select value={newOption.type} onChange={(e) => setNewOption({ ...newOption, type: e.target.value })} label="Option Type">
                  <MenuItem value="SELECT">Dropdown</MenuItem>
                  <MenuItem value="RADIO">Radio Button</MenuItem>
                  <MenuItem value="COLOR">Color Swatch</MenuItem>
                  <MenuItem value="SIZE">Size</MenuItem>
                </Select>
              </FormControl>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Choices</Typography>
              {newOption.choices.map((choice, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                        label={`Choice ${index + 1}`}
                        value={typeof choice === 'object' ? choice.text : choice}
                        onChange={(e) => handleNewOptionChoiceChange(index, e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <TextField
                        label="Price Modifier"
                        type="number"
                        value={typeof choice === 'object' ? choice.priceModifier : 0}
                        onChange={(e) => handleNewOptionPriceModifierChange(index, parseFloat(e.target.value))}
                        size="small"
                        sx={{ width: '150px' }}
                    />
                    <IconButton onClick={() => handleNewOptionRemoveChoice(index)} disabled={newOption.choices.length <= 1} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
              ))}
              <Button startIcon={<AddIcon />} onClick={handleNewOptionAddChoice} size="small" sx={{ alignSelf: 'flex-start' }}>
                Add Choice
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOptionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddOption} variant="contained" color="primary">
              Add Option
            </Button>
          </DialogActions>
        </Dialog>
        {/* Edit Option Dialog */}
        <Dialog open={editOptionDialogOpen} onClose={() => setEditOptionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Option</DialogTitle>
          <DialogContent>
            {editingOption && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                  <TextField
                      label="Option Name"
                      value={editingOption.name}
                      onChange={(e) =>
                          setEditingOption({
                            ...editingOption,
                            name: e.target.value,
                            nameTranslated: { en: e.target.value }
                          })
                      }
                      fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Option Type</InputLabel>
                    <Select value={editingOption.type} onChange={(e) => setEditingOption({ ...editingOption, type: e.target.value })} label="Option Type">
                      <MenuItem value="SELECT">Dropdown</MenuItem>
                      <MenuItem value="RADIO">Radio Button</MenuItem>
                      <MenuItem value="COLOR">Color Swatch</MenuItem>
                      <MenuItem value="SIZE">Size</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                      control={<Switch checked={editingOption.required} onChange={(e) => setEditingOption({ ...editingOption, required: e.target.checked })} />}
                      label="Required Option"
                  />
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2">Choices</Typography>
                  {editingOption.choices.map((choice, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            label={`Choice ${index + 1}`}
                            value={choice.text}
                            onChange={(e) => {
                              const updatedChoices = [...editingOption.choices];
                              updatedChoices[index].text = e.target.value;
                              updatedChoices[index].textTranslated = { en: e.target.value };
                              setEditingOption({ ...editingOption, choices: updatedChoices });
                            }}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Price Modifier"
                            type="number"
                            value={choice.priceModifier}
                            onChange={(e) => {
                              const updatedChoices = [...editingOption.choices];
                              updatedChoices[index].priceModifier = parseFloat(e.target.value);
                              setEditingOption({ ...editingOption, choices: updatedChoices });
                            }}
                            size="small"
                            sx={{ width: '150px' }}
                        />
                        <FormControl size="small" sx={{ width: '150px' }}>
                          <InputLabel>Modifier Type</InputLabel>
                          <Select
                              label="Modifier Type"
                              value={choice.priceModifierType || 'ABSOLUTE'}
                              onChange={(e) => {
                                const updatedChoices = [...editingOption.choices];
                                updatedChoices[index].priceModifierType = e.target.value;
                                setEditingOption({ ...editingOption, choices: updatedChoices });
                              }}
                          >
                            <MenuItem value="ABSOLUTE">Absolute</MenuItem>
                            <MenuItem value="PERCENT">Percent</MenuItem>
                          </Select>
                        </FormControl>
                        <IconButton
                            onClick={() => {
                              const updatedChoices = [...editingOption.choices];
                              if (updatedChoices.length > 1) {
                                updatedChoices.splice(index, 1);
                                setEditingOption({ ...editingOption, choices: updatedChoices });
                              }
                            }}
                            disabled={editingOption.choices.length <= 1}
                            color="error"
                            size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                  ))}
                  <Button
                      startIcon={<AddIcon />}
                      onClick={() => {
                        const updatedChoices = [
                          ...editingOption.choices,
                          { text: '', textTranslated: { en: '' }, priceModifier: 0, priceModifierType: 'ABSOLUTE' }
                        ];
                        setEditingOption({ ...editingOption, choices: updatedChoices });
                      }}
                      size="small"
                      sx={{ alignSelf: 'flex-start' }}
                  >
                    Add Choice
                  </Button>
                </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOptionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEditedOption} variant="contained" color="primary">
              Save Option
            </Button>
          </DialogActions>
        </Dialog>
        {/* Add Wholesale Price Dialog */}
        <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Add Wholesale Price</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                  label="Minimum Quantity"
                  value={newDiscount.quantity}
                  onChange={(e) => setNewDiscount({ ...newDiscount, quantity: parseInt(e.target.value) || 0 })}
                  type="number"
                  fullWidth
              />
              <TextField
                  label="Price"
                  value={newDiscount.price}
                  onChange={(e) => setNewDiscount({ ...newDiscount, price: parseFloat(e.target.value) || 0 })}
                  type="number"
                  fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiscountDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDiscount} variant="contained" color="primary">
              Add Price
            </Button>
          </DialogActions>
        </Dialog>
        {/* Variation Dialog */}
        <VariationDialog
            open={variationDialogOpen}
            onClose={() => setVariationDialogOpen(false)}
            variation={editingVariation}
            productOptions={productOptions}
            onSave={(data) => {
              if (editingVariation) {
                const updatedVariations = variations.map(v => (v.id === editingVariation.id ? { ...v, ...data } : v));
                setVariations(updatedVariations);
              } else {
                const newVariation = { ...data, id: 0 };
                setVariations([...variations, newVariation]);
              }
              setVariationDialogOpen(false);
            }}
        />
        {/* Loading Overlay */}
        {loading && (
            <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 9999
                }}
            >
              <CircularProgress color="primary" />
            </Box>
        )}
        {/* Notification */}
        <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification({ ...notification, open: false })}>
          <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
  );
};

export default EcwidProduct;
