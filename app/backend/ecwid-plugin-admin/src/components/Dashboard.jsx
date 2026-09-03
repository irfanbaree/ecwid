import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Container,
  Collapse,
  styled,
  IconButton,
  TextField,
  Stack,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  LocalShipping as ShippingIcon,
  Redeem,
  MoneyOff,
  MoneyOffCsred,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Sample products data remains unchanged
/*const products = [
  { name: 'Product A', stock: 45, revenue: 2500, cost: 1500, tax: 200, postage: 150 },
  { name: 'Product B', stock: 32, revenue: 1800, cost: 1000, tax: 150, postage: 100 },
  { name: 'Bundle X', stock: 28, revenue: 3500, cost: 2000, tax: 300, postage: 200 },
];*/

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme }) => ({
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
  variants: [
    {
      props: ({ expand }) => !expand,
      style: {
        transform: 'rotate(0deg)',
      },
    },
    {
      props: ({ expand }) => !!expand,
      style: {
        transform: 'rotate(180deg)',
      },
    },
  ],
}));

const StatCard = ({ icon: Icon, title, value, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon sx={{ fontSize: 40, color }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h6">{value}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
);

const Dashboard = ({ api, isAuthenticated }) => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({});
  const [graphData, setGraphData] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // first day of current month
    end: new Date().toISOString().split('T')[0], // today's date
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [graphProducts, setGraphProducts] = useState([]);

  // State for toggling lines in the profit chart
  const [selectedLines, setSelectedLines] = useState({
    revenue: true,
    profit: true,
    shipping: true,
  });


  const getInventory = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data.items);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };


  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStockStatusColor = (stock) => {
    if (stock) return 'success';
    // if (!stock) return 'warning';
    return 'error';
  };

  // Fetch both statistics and graph data when authentication or date range changes
  useEffect(() => {
    if (isAuthenticated) {
      getStatistics();
      getProfitData();
      if (tabValue === 2) getInventory();
    }
  }, [isAuthenticated, dateRange, tabValue]);

  const getStatistics = async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes, productTabRes] = await Promise.all([
        api.get(`/api/products/count?from=${dateRange.start}&to=${dateRange.end}`),
        api.get(`/api/orders/total?from=${dateRange.start}&to=${dateRange.end}`),
        api.get(`/api/products-stats?from=${dateRange.start}&to=${dateRange.end}`),
      ]);

      setStats({
        productCount: productsRes.data.count,
        orderTotal: ordersRes.data.total,
        totalTax: ordersRes.data.tax,
        totalShipping: ordersRes.data.shipping,
        totalRevenue: ordersRes.data.revenue,
        totalProfit: ordersRes.data.profit,
      });
      setGraphProducts(productTabRes.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profit/graph data from the API endpoint and update state
  const getProfitData = async () => {
    try {
      const response = await api.get(`/api/graph?from=${dateRange.start}&to=${dateRange.end}`);
      setGraphData(response.data);
    } catch (err) {
      console.error('Error fetching graph data:', err);
    }
  };

  // Update date range and trigger fetching of new data
  const handleDateChange = (type) => (event) => {
    setDateRange((prev) => ({
      ...prev,
      [type]: event.target.value,
    }));
  };

  // Toggle line visibility in the profit chart
  const handleCheckboxChange = (event) => {
    setSelectedLines({
      ...selectedLines,
      [event.target.name]: event.target.checked,
    });
  };

  return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Dashboard
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                  label="Start Date"
                  type="date"
                  value={dateRange.start}
                  onChange={handleDateChange('start')}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 200 }}
              />
              <TextField
                  label="End Date"
                  type="date"
                  value={dateRange.end}
                  onChange={handleDateChange('end')}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 200 }}
              />
            </Stack>
          </Box>

          {/* Quick Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                  icon={InventoryIcon}
                  title="Products"
                  value={loading ? '...' : stats.productCount?.toLocaleString() ?? 0}
                  color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                  icon={Redeem}
                  title="Orders"
                  value={loading ? '...' : `$${stats.orderTotal?.toLocaleString() ?? 0}`}
                  color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                  icon={ShippingIcon}
                  title="Shipping"
                  value={`$ ${loading ? '...' : stats.totalShipping ?? 0}`}
                  color="#ed6c02"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                  icon={MoneyOffCsred}
                  title="Profit"
                  value={`$ ${loading ? '...' : stats.totalProfit ?? 0}`}
                  color="#ed6c02"
              />
            </Grid>
            <Grid item xs={12}>
              <Grid container justifyContent="flex-end">
                <ExpandMore
                    expand={expanded}
                    onClick={(e) => setExpanded(!expanded)}
                    aria-expanded={expanded}
                    aria-label="show more"
                >
                  <ExpandMoreIcon />
                </ExpandMore>
              </Grid>
            </Grid>
            <Grid item xs={12} style={{ paddingTop: 0 }}>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Grid item xs={12}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard
                          icon={MoneyOff}
                          title="Tax"
                          value={`$ ${loading ? '...' : stats.totalTax ?? 0}`}
                          color="#ed6c02"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatCard
                          icon={MoneyIcon}
                          title="Revenue"
                          value={`$ ${loading ? '...' : stats.totalRevenue ?? 0}`}
                          color="#2e7d32"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Overview" />
                <Tab label="Products" />
                <Tab label="Inventory" />
              </Tabs>
            </Box>

            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Profit Overview
                  </Typography>
                  <FormGroup row sx={{ mb: 2 }}>
                    <FormControlLabel
                        control={
                          <Checkbox
                              checked={selectedLines.revenue}
                              onChange={handleCheckboxChange}
                              name="revenue"
                          />
                        }
                        label="Revenue"
                    />
                    <FormControlLabel
                        control={
                          <Checkbox
                              checked={selectedLines.profit}
                              onChange={handleCheckboxChange}
                              name="profit"
                          />
                        }
                        label="Profit"
                    />
                    <FormControlLabel
                        control={
                          <Checkbox
                              checked={selectedLines.shipping}
                              onChange={handleCheckboxChange}
                              name="shipping"
                          />
                        }
                        label="Shipping"
                    />
                  </FormGroup>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {selectedLines.revenue && (
                            <Line type="monotone" dataKey="revenue" stroke="#1976d2" />
                        )}
                        {selectedLines.profit && (
                            <Line type="monotone" dataKey="profit" stroke="#2e7d32" />
                        )}
                        {selectedLines.shipping && (
                            <Line type="monotone" dataKey="total" stroke="#d32f2f" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </TabPanel>

            {/* Products Tab */}
            <TabPanel value={tabValue} index={1}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Cost</TableCell>
                      <TableCell align="right">Tax</TableCell>
                      <TableCell align="right">Postage</TableCell>
                      <TableCell align="right">Profit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(graphProducts || []).map((product) => (
                        <TableRow key={product.productName}>
                          <TableCell>{product.productName}</TableCell>
                          <TableCell align="right">{product.revenue}</TableCell>
                          <TableCell align="right">{product.productCost}</TableCell>
                          <TableCell align="right">{product.tax}</TableCell>
                          <TableCell align="right">{product.shipping}</TableCell>
                          <TableCell align="right">
                            {(product.revenue ?? 0) - (product.productCost ?? 0) - (product.tax ?? 0) - (product.shipping ?? 0)}
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Inventory Tab */}
            <TabPanel value={tabValue} index={2}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Stock Level</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.name}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell align="right">{product.unlimited?'unlimited':product.quantity}</TableCell>
                          <TableCell align="right">
                            <Chip
                                label={
                                  product.inStock
                                      ? 'In Stock'
                                      : 'Outofstock'
                                }
                                color={getStockStatusColor(product.inStock)}
                                size="small"
                            />
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Box>
        </Box>
      </Container>
  );
};

const TabPanel = ({ children, value, index }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
);

export default Dashboard;
