import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Box,
  Grid,
  Divider,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SaveIcon from '@mui/icons-material/Save';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pack-bundle-tabpanel-${index}`}
      aria-labelledby={`pack-bundle-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PackBundle = ({ api, isAuthenticated }) => {
  // States for managing bundle creation
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [packCount, setPackCount] = useState(1);
  const [packs, setPacks] = useState([{ packId: 1, options: [], quantity: 1 }]);
  const [variations, setVariations] = useState([]);
  const [bulkDiscounts, setBulkDiscounts] = useState([
    { quantity: 5, discount: 5 },
    { quantity: 10, discount: 10 }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch products on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/products');
      setProducts(response.data.items || []);
    } catch (error) {
      showSnackbar("Failed to fetch products. Please try again.", "error");
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle product selection
  const handleProductSelect = (event) => {
    const productId = event.target.value;
    const product = products.find(p => p.id === parseInt(productId));
    setSelectedProduct(product);
    
    // Initialize pack options based on the selected product
    if (product && product.options && product.options.length > 0) {
      const updatedPacks = packs.map(pack => ({
        ...pack,
        options: product.options.map(option => ({
          name: option.name,
          values: [],
          availableValues: option.values.map(v => ({
            id: v.id,
            name: v.name,
            selected: false
          }))
        }))
      }));
      setPacks(updatedPacks);
    }
  };

  // Add a new pack
  const addPack = () => {
    const newPackId = packCount + 1;
    setPackCount(newPackId);
    
    const newPack = {
      packId: newPackId,
      quantity: 1,
      options: selectedProduct?.options?.map(option => ({
        name: option.name,
        values: [],
        availableValues: option.values.map(v => ({
          id: v.id,
          name: v.name,
          selected: false
        }))
      })) || []
    };
    
    setPacks([...packs, newPack]);
  };

  // Remove a pack
  const removePack = (packId) => {
    if (packs.length > 1) {
      setPacks(packs.filter(pack => pack.packId !== packId));
    }
  };

  // Update pack quantity
  const updatePackQuantity = (packId, quantity) => {
    setPacks(packs.map(pack => 
      pack.packId === packId ? { ...pack, quantity: parseInt(quantity) || 1 } : pack
    ));
  };

  // Toggle option value for a pack
  const toggleOptionValue = (packId, optionName, valueId) => {
    setPacks(packs.map(pack => {
      if (pack.packId === packId) {
        const updatedOptions = pack.options.map(option => {
          if (option.name === optionName) {
            const updatedAvailableValues = option.availableValues.map(value => {
              if (value.id === valueId) {
                return { ...value, selected: !value.selected };
              }
              return value;
            });
            
            // Update selected values
            const selectedValues = updatedAvailableValues
              .filter(value => value.selected)
              .map(value => ({ id: value.id, name: value.name }));
            
            return {
              ...option,
              availableValues: updatedAvailableValues,
              values: selectedValues
            };
          }
          return option;
        });
        
        return { ...pack, options: updatedOptions };
      }
      return pack;
    }));
  };

  // Generate variations based on selected options
  const generateVariations = () => {
    // Identify all packs with selected options
    const packsWithOptions = packs.filter(pack => 
      pack.options.some(option => option.values.length > 0)
    );
    
    if (packsWithOptions.length === 0) {
      showSnackbar("Please select at least one option for any pack to generate variations", "warning");
      return;
    }
    
    // Generate all possible combinations
    let combinations = [[]];
    
    packsWithOptions.forEach(pack => {
      const packCombinations = [];
      
      pack.options.forEach(option => {
        if (option.values.length > 0) {
          option.values.forEach(value => {
            combinations.forEach(combo => {
              packCombinations.push([...combo, {
                packId: pack.packId,
                optionName: option.name,
                value: value.name,
                valueId: value.id
              }]);
            });
          });
        }
      });
      
      if (packCombinations.length > 0) {
        combinations = packCombinations;
      }
    });
    
    // Format variations
    const newVariations = combinations.map((combo, index) => {
      const sku = `BUNDLE-${selectedProduct?.id || '0'}-${index + 1}`;
      const name = combo.map(c => `Pack ${c.packId}: ${c.optionName} - ${c.value}`).join(', ');
      
      return {
        id: index + 1,
        name,
        sku,
        price: selectedProduct?.price || 0,
        options: combo,
        enabled: true
      };
    });
    
    setVariations(newVariations);
    setTabValue(2); // Switch to variations tab
  };

  // Add a new bulk discount tier
  const addBulkDiscount = () => {
    setBulkDiscounts([...bulkDiscounts, { quantity: 15, discount: 15 }]);
  };

  // Remove a bulk discount tier
  const removeBulkDiscount = (index) => {
    const updatedDiscounts = [...bulkDiscounts];
    updatedDiscounts.splice(index, 1);
    setBulkDiscounts(updatedDiscounts);
  };

  // Update bulk discount values
  const updateBulkDiscount = (index, field, value) => {
    const updatedDiscounts = bulkDiscounts.map((discount, i) => {
      if (i === index) {
        return { ...discount, [field]: parseInt(value) || 0 };
      }
      return discount;
    });
    setBulkDiscounts(updatedDiscounts);
  };

  // Submit bundle to Ecwid API
  const createBundle = async () => {
    if (!selectedProduct) {
      showSnackbar("Please select a product first", "error");
      return;
    }

    if (!bundleName.trim()) {
      showSnackbar("Please enter a bundle name", "error");
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare product data for Ecwid APIimport React, { useState, useEffect } from 'react';
      // import {
      //   Card,
      //   CardContent,
      //   CardHeader,
      //   CardActions,
      //   Typography,
      //   Button,
      //   TextField,
      //   Select,
      //   MenuItem,
      //   InputLabel,
      //   FormControl,
      //   FormControlLabel,
      //   Checkbox,
      //   Tabs,
      //   Tab,
      //   Box,
      //   Grid,
      //   Divider,
      //   Paper,
      //   IconButton,
      //   Table,
      //   TableBody,
      //   TableCell,
      //   TableContainer,
      //   TableHead,
      //   TableRow,
      //   Snackbar,
      //   Alert,
      //   CircularProgress
      // } from '@mui/material';
      // import AddCircleIcon from '@mui/icons-material/AddCircle';
      // import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
      // import SaveIcon from '@mui/icons-material/Save';
      //
      // // TabPanel component for tab content
      // function TabPanel(props) {
      //   const { children, value, index, ...other } = props;
      //
      //   return (
      //     <div
      //       role="tabpanel"
      //       hidden={value !== index}
      //       id={`pack-bundle-tabpanel-${index}`}
      //       aria-labelledby={`pack-bundle-tab-${index}`}
      //       {...other}
      //     >
      //       {value === index && (
      //         <Box sx={{ p: 3 }}>
      //           {children}
      //         </Box>
      //       )}
      //     </div>
      //   );
      // }
      //
      // const PackBundle = ({ api, isAuthenticated }) => {
      //   // States for managing bundle creation
      //   const [products, setProducts] = useState([]);
      //   const [selectedProduct, setSelectedProduct] = useState(null);
      //   const [bundleName, setBundleName] = useState('');
      //   const [bundleDescription, setBundleDescription] = useState('');
      //   const [packCount, setPackCount] = useState(1);
      //   const [packs, setPacks] = useState([{ packId: 1, options: [], quantity: 1 }]);
      //   const [variations, setVariations] = useState([]);
      //   const [bulkDiscounts, setBulkDiscounts] = useState([
      //     { quantity: 5, discount: 5 },
      //     { quantity: 10, discount: 10 }
      //   ]);
      //   const [isLoading, setIsLoading] = useState(false);
      //   const [tabValue, setTabValue] = useState(0);
      //   const [snackbar, setSnackbar] = useState({
      //     open: false,
      //     message: '',
      //     severity: 'success'
      //   });
      //
      //   // Fetch products on component mount
      //   useEffect(() => {
      //     if (isAuthenticated) {
      //       fetchProducts();
      //     }
      //   }, [isAuthenticated]);
      //
      //   const fetchProducts = async () => {
      //     try {
      //       setIsLoading(true);
      //       const response = await api.get('/api/products');
      //       setProducts(response.data.items || []);
      //     } catch (error) {
      //       showSnackbar("Failed to fetch products. Please try again.", "error");
      //       console.error("Error fetching products:", error);
      //     } finally {
      //       setIsLoading(false);
      //     }
      //   };
      //
      //   const showSnackbar = (message, severity = "success") => {
      //     setSnackbar({
      //       open: true,
      //       message,
      //       severity
      //     });
      //   };
      //
      //   const handleCloseSnackbar = () => {
      //     setSnackbar({ ...snackbar, open: false });
      //   };
      //
      //   const handleTabChange = (event, newValue) => {
      //     setTabValue(newValue);
      //   };
      //
      //   // Handle product selection
      //   const handleProductSelect = (event) => {
      //     const productId = event.target.value;
      //     const product = products.find(p => p.id === parseInt(productId));
      //     setSelectedProduct(product);
      //
      //     // Initialize pack options based on the selected product
      //     if (product && product.options && product.options.length > 0) {
      //       const updatedPacks = packs.map(pack => ({
      //         ...pack,
      //         options: product.options.map(option => ({
      //           name: option.name,
      //           values: [],
      //           availableValues: option.values.map(v => ({
      //             id: v.id,
      //             name: v.name,
      //             selected: false
      //           }))
      //         }))
      //       }));
      //       setPacks(updatedPacks);
      //     }
      //   };
      //
      //   // Add a new pack
      //   const addPack = () => {
      //     const newPackId = packCount + 1;
      //     setPackCount(newPackId);
      //
      //     const newPack = {
      //       packId: newPackId,
      //       quantity: 1,
      //       options: selectedProduct?.options?.map(option => ({
      //         name: option.name,
      //         values: [],
      //         availableValues: option.values.map(v => ({
      //           id: v.id,
      //           name: v.name,
      //           selected: false
      //         }))
      //       })) || []
      //     };
      //
      //     setPacks([...packs, newPack]);
      //   };
      //
      //   // Remove a pack
      //   const removePack = (packId) => {
      //     if (packs.length > 1) {
      //       setPacks(packs.filter(pack => pack.packId !== packId));
      //     }
      //   };
      //
      //   // Update pack quantity
      //   const updatePackQuantity = (packId, quantity) => {
      //     setPacks(packs.map(pack =>
      //       pack.packId === packId ? { ...pack, quantity: parseInt(quantity) || 1 } : pack
      //     ));
      //   };
      //
      //   // Toggle option value for a pack
      //   const toggleOptionValue = (packId, optionName, valueId) => {
      //     setPacks(packs.map(pack => {
      //       if (pack.packId === packId) {
      //         const updatedOptions = pack.options.map(option => {
      //           if (option.name === optionName) {
      //             const updatedAvailableValues = option.availableValues.map(value => {
      //               if (value.id === valueId) {
      //                 return { ...value, selected: !value.selected };
      //               }
      //               return value;
      //             });
      //
      //             // Update selected values
      //             const selectedValues = updatedAvailableValues
      //               .filter(value => value.selected)
      //               .map(value => ({ id: value.id, name: value.name }));
      //
      //             return {
      //               ...option,
      //               availableValues: updatedAvailableValues,
      //               values: selectedValues
      //             };
      //           }
      //           return option;
      //         });
      //
      //         return { ...pack, options: updatedOptions };
      //       }
      //       return pack;
      //     }));
      //   };
      //
      //   // Generate variations based on selected options
      //   const generateVariations = () => {
      //     // Identify all packs with selected options
      //     const packsWithOptions = packs.filter(pack =>
      //       pack.options.some(option => option.values.length > 0)
      //     );
      //
      //     if (packsWithOptions.length === 0) {
      //       showSnackbar("Please select at least one option for any pack to generate variations", "warning");
      //       return;
      //     }
      //
      //     // Generate all possible combinations
      //     let combinations = [[]];
      //
      //     packsWithOptions.forEach(pack => {
      //       const packCombinations = [];
      //
      //       pack.options.forEach(option => {
      //         if (option.values.length > 0) {
      //           option.values.forEach(value => {
      //             combinations.forEach(combo => {
      //               packCombinations.push([...combo, {
      //                 packId: pack.packId,
      //                 optionName: option.name,
      //                 value: value.name,
      //                 valueId: value.id
      //               }]);
      //             });
      //           });
      //         }
      //       });
      //
      //       if (packCombinations.length > 0) {
      //         combinations = packCombinations;
      //       }
      //     });
      //
      //     // Format variations
      //     const newVariations = combinations.map((combo, index) => {
      //       const sku = `BUNDLE-${selectedProduct?.id || '0'}-${index + 1}`;
      //       const name = combo.map(c => `Pack ${c.packId}: ${c.optionName} - ${c.value}`).join(', ');
      //
      //       return {
      //         id: index + 1,
      //         name,
      //         sku,
      //         price: selectedProduct?.price || 0,
      //         options: combo,
      //         enabled: true
      //       };
      //     });
      //
      //     setVariations(newVariations);
      //     setTabValue(2); // Switch to variations tab
      //   };
      //
      //   // Add a new bulk discount tier
      //   const addBulkDiscount = () => {
      //     setBulkDiscounts([...bulkDiscounts, { quantity: 15, discount: 15 }]);
      //   };
      //
      //   // Remove a bulk discount tier
      //   const removeBulkDiscount = (index) => {
      //     const updatedDiscounts = [...bulkDiscounts];
      //     updatedDiscounts.splice(index, 1);
      //     setBulkDiscounts(updatedDiscounts);
      //   };
      //
      //   // Update bulk discount values
      //   const updateBulkDiscount = (index, field, value) => {
      //     const updatedDiscounts = bulkDiscounts.map((discount, i) => {
      //       if (i === index) {
      //         return { ...discount, [field]: parseInt(value) || 0 };
      //       }
      //       return discount;
      //     });
      //     setBulkDiscounts(updatedDiscounts);
      //   };
      //
      //   // Submit bundle to Ecwid API
      //   const createBundle = async () => {
      //     if (!selectedProduct) {
      //       showSnackbar("Please select a product first", "error");
      //       return;
      //     }
      //
      //     if (!bundleName.trim()) {
      //       showSnackbar("Please enter a bundle name", "error");
      //       return;
      //     }
      //
      //     try {
      //       setIsLoading(true);
      //
      //       // Prepare product data for Ecwid API
      //       const bundleData = {
      //         name: bundleName,
      //         description: bundleDescription,
      //         price: selectedProduct.price,
      //         enabled: true,
      //         type: "PHYSICAL",
      //         options: selectedProduct.options?.map(option => ({
      //           name: option.name,
      //           required: false,
      //           choices: option.values
      //         })) || [],
      //         variations: variations.map(variation => ({
      //           sku: variation.sku,
      //           price: variation.price,
      //           options: variation.options.map(opt => ({
      //             name: opt.optionName,
      //             value: opt.value
      //           }))
      //         })),
      //         wholesale: {
      //           enabled: bulkDiscounts.length > 0,
      //           tiers: bulkDiscounts.map(tier => ({
      //             quantity: tier.quantity,
      //             discount: tier.discount
      //           }))
      //         },
      //         // Add custom field for bundle packs configuration
      //         attributes: [{
      //           name: "Bundle Packs",
      //           value: JSON.stringify(packs),
      //           type: "CUSTOM",
      //           show: false
      //         }]
      //       };
      //
      //       // Submit to Ecwid API
      //       const response = await api.post('/products', bundleData);
      //
      //       showSnackbar("Bundle created successfully!");
      //
      //       // Reset form
      //       setBundleName('');
      //       setBundleDescription('');
      //       setSelectedProduct(null);
      //       setPackCount(1);
      //       setPacks([{ packId: 1, options: [], quantity: 1 }]);
      //       setVariations([]);
      //       setBulkDiscounts([
      //         { quantity: 5, discount: 5 },
      //         { quantity: 10, discount: 10 }
      //       ]);
      //       setTabValue(0);
      //
      //     } catch (error) {
      //       showSnackbar("Failed to create bundle. Please try again.", "error");
      //       console.error("Error creating bundle:", error);
      //     } finally {
      //       setIsLoading(false);
      //     }
      //   };
      //
      //   if (!isAuthenticated) {
      //     return (
      //       <Box sx={{ p: 4 }}>
      //         <Typography>Please log in to access this feature.</Typography>
      //       </Box>
      //     );
      //   }
      //
      //   return (
      //     <Card sx={{ maxWidth: 1200, mx: 'auto', mb: 4 }}>
      //       <CardHeader
      //         title="Create Pack Bundle"
      //         subheader="Create product bundle packs with custom options and bulk discounts"
      //       />
      //       <Divider />
      //
      //       <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      //         <Tabs value={tabValue} onChange={handleTabChange} aria-label="pack bundle tabs">
      //           <Tab label="Basic Info" id="pack-bundle-tab-0" aria-controls="pack-bundle-tabpanel-0" />
      //           <Tab label="Pack Options" id="pack-bundle-tab-1" aria-controls="pack-bundle-tabpanel-1" />
      //           <Tab label="Variations" id="pack-bundle-tab-2" aria-controls="pack-bundle-tabpanel-2" />
      //           <Tab label="Bulk Discounts" id="pack-bundle-tab-3" aria-controls="pack-bundle-tabpanel-3" />
      //         </Tabs>
      //       </Box>
      //
      //       <CardContent>
      //         <TabPanel value={tabValue} index={0}>
      //           <Grid container spacing={3}>
      //             <Grid item xs={12}>
      //               <FormControl fullWidth disabled={isLoading}>
      //                 <InputLabel id="product-select-label">Select Product</InputLabel>
      //                 <Select
      //                   labelId="product-select-label"
      //                   id="product-select"
      //                   value={selectedProduct?.id || ""}
      //                   label="Select Product"
      //                   onChange={handleProductSelect}
      //                 >
      //                   {products.map((product) => (
      //                     <MenuItem key={product.id} value={product.id}>
      //                       {product.name}
      //                     </MenuItem>
      //                   ))}
      //                 </Select>
      //               </FormControl>
      //             </Grid>
      //
      //             <Grid item xs={12}>
      //               <TextField
      //                 fullWidth
      //                 label="Bundle Name"
      //                 value={bundleName}
      //                 onChange={(e) => setBundleName(e.target.value)}
      //                 disabled={isLoading}
      //               />
      //             </Grid>
      //
      //             <Grid item xs={12}>
      //               <TextField
      //                 fullWidth
      //                 label="Description"
      //                 value={bundleDescription}
      //                 onChange={(e) => setBundleDescription(e.target.value)}
      //                 multiline
      //                 rows={3}
      //                 disabled={isLoading}
      //               />
      //             </Grid>
      //
      //             {selectedProduct && (
      //               <Grid item xs={12}>
      //                 <Typography variant="body2" color="text.secondary">
      //                   Base Price: ${selectedProduct.price}
      //                 </Typography>
      //               </Grid>
      //             )}
      //           </Grid>
      //         </TabPanel>
      //
      //         <TabPanel value={tabValue} index={1}>
      //           {!selectedProduct ? (
      //             <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center' }}>
      //               <Typography>Please select a product first</Typography>
      //             </Box>
      //           ) : (
      //             <>
      //               {packs.map((pack) => (
      //                 <Paper key={pack.packId} sx={{ p: 2, mb: 3 }} elevation={2}>
      //                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      //                     <Typography variant="h6">Pack #{pack.packId}</Typography>
      //                     <IconButton
      //                       onClick={() => removePack(pack.packId)}
      //                       disabled={packs.length <= 1 || isLoading}
      //                       size="small"
      //                     >
      //                       <RemoveCircleIcon />
      //                     </IconButton>
      //                   </Box>
      //
      //                   <Grid container spacing={3}>
      //                     <Grid item xs={12} sm={6} md={4}>
      //                       <TextField
      //                         label="Quantity"
      //                         type="number"
      //                         InputProps={{ inputProps: { min: 1 } }}
      //                         value={pack.quantity}
      //                         onChange={(e) => updatePackQuantity(pack.packId, e.target.value)}
      //                         disabled={isLoading}
      //                         sx={{ width: 120 }}
      //                       />
      //                     </Grid>
      //
      //                     <Grid item xs={12}>
      //                       {pack.options && pack.options.length > 0 ? (
      //                         <>
      //                           <Typography variant="subtitle1" sx={{ mb: 1 }}>Options</Typography>
      //                           {pack.options.map((option) => (
      //                             <Box key={option.name} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      //                               <Typography variant="subtitle2" sx={{ mb: 1 }}>{option.name}</Typography>
      //                               <Grid container spacing={1}>
      //                                 {option.availableValues.map((value) => (
      //                                   <Grid item xs={6} sm={4} md={3} key={value.id}>
      //                                     <FormControlLabel
      //                                       control={
      //                                         <Checkbox
      //                                           checked={value.selected}
      //                                           onChange={() => toggleOptionValue(pack.packId, option.name, value.id)}
      //                                           disabled={isLoading}
      //                                         />
      //                                       }
      //                                       label={value.name}
      //                                     />
      //                                   </Grid>
      //                                 ))}
      //                               </Grid>
      //                             </Box>
      //                           ))}
      //                         </>
      //                       ) : (
      //                         <Typography variant="body2" color="text.secondary">
      //                           No options available for this product
      //                         </Typography>
      //                       )}
      //                     </Grid>
      //                   </Grid>
      //                 </Paper>
      //               ))}
      //
      //               <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
      //                 <Button
      //                   variant="outlined"
      //                   startIcon={<AddCircleIcon />}
      //                   onClick={addPack}
      //                   disabled={isLoading}
      //                 >
      //                   Add Pack
      //                 </Button>
      //
      //                 <Button
      //                   variant="contained"
      //                   color="secondary"
      //                   onClick={generateVariations}
      //                   disabled={isLoading}
      //                 >
      //                   Generate Variations
      //                 </Button>
      //               </Box>
      //             </>
      //           )}
      //         </TabPanel>
      //
      //         <TabPanel value={tabValue} index={2}>
      //           {variations.length === 0 ? (
      //             <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center' }}>
      //               <Typography>
      //                 No variations generated yet. Please define packs and options, then generate variations.
      //               </Typography>
      //             </Box>
      //           ) : (
      //             <Box>
      //               <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
      //                 <Typography variant="subtitle1">
      //                   Total variations: {variations.length}
      //                 </Typography>
      //               </Paper>
      //
      //               <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
      //                 <Table stickyHeader>
      //                   <TableHead>
      //                     <TableRow>
      //                       <TableCell>Name</TableCell>
      //                       <TableCell>SKU</TableCell>
      //                       <TableCell>Price</TableCell>
      //                       <TableCell>Enabled</TableCell>
      //                     </TableRow>
      //                   </TableHead>
      //                   <TableBody>
      //                     {variations.map((variation) => (
      //                       <TableRow key={variation.id}>
      //                         <TableCell>{variation.name}</TableCell>
      //                         <TableCell>{variation.sku}</TableCell>
      //                         <TableCell>
      //                           <TextField
      //                             type="number"
      //                             size="small"
      //                             InputProps={{
      //                               inputProps: { min: 0, step: 0.01 },
      //                               startAdornment: '$'
      //                             }}
      //                             value={variation.price}
      //                             onChange={(e) => {
      //                               const updatedVariations = variations.map(v =>
      //                                 v.id === variation.id ? { ...v, price: parseFloat(e.target.value) || 0 } : v
      //                               );
      //                               setVariations(updatedVariations);
      //                             }}
      //                             disabled={isLoading}
      //                             sx={{ width: 100 }}
      //                           />
      //                         </TableCell>
      //                         <TableCell>
      //                           <Checkbox
      //                             checked={variation.enabled}
      //                             onChange={(e) => {
      //                               const updatedVariations = variations.map(v =>
      //                                 v.id === variation.id ? { ...v, enabled: e.target.checked } : v
      //                               );
      //                               setVariations(updatedVariations);
      //                             }}
      //                             disabled={isLoading}
      //                           />
      //                         </TableCell>
      //                       </TableRow>
      //                     ))}
      //                   </TableBody>
      //                 </Table>
      //               </TableContainer>
      //             </Box>
      //           )}
      //         </TabPanel>
      //
      //         <TabPanel value={tabValue} index={3}>
      //           <Grid container spacing={2}>
      //             {bulkDiscounts.map((discount, index) => (
      //               <Grid item xs={12} key={index}>
      //                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      //                   <TextField
      //                     label="Quantity"
      //                     type="number"
      //                     InputProps={{ inputProps: { min: 1 } }}
      //                     value={discount.quantity}
      //                     onChange={(e) => updateBulkDiscount(index, 'quantity', e.target.value)}
      //                     disabled={isLoading}
      //                     sx={{ width: 120 }}
      //                   />
      //
      //                   <TextField
      //                     label="Discount %"
      //                     type="number"
      //                     InputProps={{ inputProps: { min: 0, max: 100 } }}
      //                     value={discount.discount}
      //                     onChange={(e) => updateBulkDiscount(index, 'discount', e.target.value)}
      //                     disabled={isLoading}
      //                     sx={{ width: 120 }}
      //                   />
      //
      //                   <IconButton
      //                     onClick={() => removeBulkDiscount(index)}
      //                     disabled={bulkDiscounts.length <= 1 || isLoading}
      //                     size="small"
      //                   >
      //                     <RemoveCircleIcon />
      //                   </IconButton>
      //                 </Box>
      //               </Grid>
      //             ))}
      //
      //             <Grid item xs={12}>
      //               <Button
      //                 variant="outlined"
      //                 startIcon={<AddCircleIcon />}
      //                 onClick={addBulkDiscount}
      //                 disabled={isLoading}
      //               >
      //                 Add Discount Tier
      //               </Button>
      //             </Grid>
      //           </Grid>
      //         </TabPanel>
      //       </CardContent>
      //
      //       <Divider />
      //
      //       <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
      //         <Button
      //           variant="outlined"
      //           onClick={() => setTabValue(0)}
      //           disabled={isLoading}
      //         >
      //           Cancel
      //         </Button>
      //         <Button
      //           variant="contained"
      //           color="primary"
      //           startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
      //           onClick={createBundle}
      //           disabled={isLoading}
      //         >
      //           Create Bundle
      //         </Button>
      //       </CardActions>
      //
      //       <Snackbar
      //         open={snackbar.open}
      //         autoHideDuration={6000}
      //         onClose={handleCloseSnackbar}
      //         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      //       >
      //         <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
      //           {snackbar.message}
      //         </Alert>
      //       </Snackbar>
      //     </Card>
      //   );
      // };
      //
      // export default PackBundle;
      const bundleData = {
        name: bundleName,
        description: bundleDescription,
        price: selectedProduct.price,
        enabled: true,
        type: "PHYSICAL",
        options: selectedProduct.options?.map(option => ({
          name: option.name,
          required: false,
          choices: option.values
        })) || [],
        variations: variations.map(variation => ({
          sku: variation.sku,
          price: variation.price,
          options: variation.options.map(opt => ({
            name: opt.optionName,
            value: opt.value
          }))
        })),
        wholesale: {
          enabled: bulkDiscounts.length > 0,
          tiers: bulkDiscounts.map(tier => ({
            quantity: tier.quantity,
            discount: tier.discount
          }))
        },
        // Add custom field for bundle packs configuration
        attributes: [{
          name: "Bundle Packs",
          value: JSON.stringify(packs),
          type: "CUSTOM",
          show: false
        }]
      };

      // Submit to Ecwid API
      const response = await api.post('/products', bundleData);
      
      showSnackbar("Bundle created successfully!");
      
      // Reset form
      setBundleName('');
      setBundleDescription('');
      setSelectedProduct(null);
      setPackCount(1);
      setPacks([{ packId: 1, options: [], quantity: 1 }]);
      setVariations([]);
      setBulkDiscounts([
        { quantity: 5, discount: 5 },
        { quantity: 10, discount: 10 }
      ]);
      setTabValue(0);
      
    } catch (error) {
      showSnackbar("Failed to create bundle. Please try again.", "error");
      console.error("Error creating bundle:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Please log in to access this feature.</Typography>
      </Box>
    );
  }

  return (
    <Card sx={{ maxWidth: 1200, mx: 'auto', mb: 4 }}>
      <CardHeader 
        title="Create Pack Bundle" 
        subheader="Create product bundle packs with custom options and bulk discounts"
      />
      <Divider />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="pack bundle tabs">
          <Tab label="Basic Info" id="pack-bundle-tab-0" aria-controls="pack-bundle-tabpanel-0" />
          <Tab label="Pack Options" id="pack-bundle-tab-1" aria-controls="pack-bundle-tabpanel-1" />
          <Tab label="Variations" id="pack-bundle-tab-2" aria-controls="pack-bundle-tabpanel-2" />
          <Tab label="Bulk Discounts" id="pack-bundle-tab-3" aria-controls="pack-bundle-tabpanel-3" />
        </Tabs>
      </Box>
      
      <CardContent>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth disabled={isLoading}>
                <InputLabel id="product-select-label">Select Product</InputLabel>
                <Select
                  labelId="product-select-label"
                  id="product-select"
                  value={selectedProduct?.id || ""}
                  label="Select Product"
                  onChange={handleProductSelect}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bundle Name"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                disabled={isLoading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={bundleDescription}
                onChange={(e) => setBundleDescription(e.target.value)}
                multiline
                rows={3}
                disabled={isLoading}
              />
            </Grid>
            
            {selectedProduct && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Base Price: ${selectedProduct.price}
                </Typography>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {!selectedProduct ? (
            <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center' }}>
              <Typography>Please select a product first</Typography>
            </Box>
          ) : (
            <>
              {packs.map((pack) => (
                <Paper key={pack.packId} sx={{ p: 2, mb: 3 }} elevation={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Pack #{pack.packId}</Typography>
                    <IconButton
                      onClick={() => removePack(pack.packId)}
                      disabled={packs.length <= 1 || isLoading}
                      size="small"
                    >
                      <RemoveCircleIcon />
                    </IconButton>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="Quantity"
                        type="number"
                        InputProps={{ inputProps: { min: 1 } }}
                        value={pack.quantity}
                        onChange={(e) => updatePackQuantity(pack.packId, e.target.value)}
                        disabled={isLoading}
                        sx={{ width: 120 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      {pack.options && pack.options.length > 0 ? (
                        <>
                          <Typography variant="subtitle1" sx={{ mb: 1 }}>Options</Typography>
                          {pack.options.map((option) => (
                            <Box key={option.name} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>{option.name}</Typography>
                              <Grid container spacing={1}>
                                {option.availableValues.map((value) => (
                                  <Grid item xs={6} sm={4} md={3} key={value.id}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={value.selected}
                                          onChange={() => toggleOptionValue(pack.packId, option.name, value.id)}
                                          disabled={isLoading}
                                        />
                                      }
                                      label={value.name}
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          ))}
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No options available for this product
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddCircleIcon />}
                  onClick={addPack}
                  disabled={isLoading}
                >
                  Add Pack
                </Button>
                
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={generateVariations}
                  disabled={isLoading}
                >
                  Generate Variations
                </Button>
              </Box>
            </>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {variations.length === 0 ? (
            <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center' }}>
              <Typography>
                No variations generated yet. Please define packs and options, then generate variations.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
                <Typography variant="subtitle1">
                  Total variations: {variations.length}
                </Typography>
              </Paper>
              
              <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Enabled</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {variations.map((variation) => (
                      <TableRow key={variation.id}>
                        <TableCell>{variation.name}</TableCell>
                        <TableCell>{variation.sku}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            InputProps={{ 
                              inputProps: { min: 0, step: 0.01 },
                              startAdornment: '$'
                            }}
                            value={variation.price}
                            onChange={(e) => {
                              const updatedVariations = variations.map(v =>
                                v.id === variation.id ? { ...v, price: parseFloat(e.target.value) || 0 } : v
                              );
                              setVariations(updatedVariations);
                            }}
                            disabled={isLoading}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={variation.enabled}
                            onChange={(e) => {
                              const updatedVariations = variations.map(v =>
                                v.id === variation.id ? { ...v, enabled: e.target.checked } : v
                              );
                              setVariations(updatedVariations);
                            }}
                            disabled={isLoading}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            {bulkDiscounts.map((discount, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="Quantity"
                    type="number"
                    InputProps={{ inputProps: { min: 1 } }}
                    value={discount.quantity}
                    onChange={(e) => updateBulkDiscount(index, 'quantity', e.target.value)}
                    disabled={isLoading}
                    sx={{ width: 120 }}
                  />
                  
                  <TextField
                    label="Discount %"
                    type="number"
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                    value={discount.discount}
                    onChange={(e) => updateBulkDiscount(index, 'discount', e.target.value)}
                    disabled={isLoading}
                    sx={{ width: 120 }}
                  />
                  
                  <IconButton
                    onClick={() => removeBulkDiscount(index)}
                    disabled={bulkDiscounts.length <= 1 || isLoading}
                    size="small"
                  >
                    <RemoveCircleIcon />
                  </IconButton>
                </Box>
              </Grid>
            ))}
            
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AddCircleIcon />}
                onClick={addBulkDiscount}
                disabled={isLoading}
              >
                Add Discount Tier
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => setTabValue(0)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={createBundle}
          disabled={isLoading}
        >
          Create Bundle
        </Button>
      </CardActions>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default PackBundle;