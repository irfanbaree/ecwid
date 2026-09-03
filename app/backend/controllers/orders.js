const axios = require("axios");
const { ECDWID_API_URL, ECWID_STORE_ID, ECWID_API_TOKEN } = process.env;
// const storeId = ECWID_STORE_ID;
// const apiToken = ECWID_API_TOKEN

module.exports = {
    getPerMonthStats: async (req, res) => {
        try {
            const ordersRes = await axios.get(`${ECDWID_API_URL}/${req.storeId}/orders`, {
                headers: { Authorization: `Bearer ${req.apiToken}` },
            });
            const productsRes = await axios.get(
                `${ECDWID_API_URL}/${req.storeId}/products`,
                {
                    headers: { Authorization: `Bearer ${req.apiToken}` },
                }
            );
            const orders = ordersRes.data.items;
            const products = productsRes.data.items;


            res
                .status(200)
                .json({
                    ordersStats: getOrdersMonthly(orders),
                    productStats: getProductsMonthly(products),
                    productCostPriceStats: calculateLast12MonthsCost(products),
                    profitStats: calculateLast12MonthsProfit(orders)
                });

        } catch (err) {
            console.log(err)
        }
    },
    getStatistics: async (req, res) => {
        try {
            const ordersRes = await axios.get(`${ECDWID_API_URL}/${req.storeId}/orders`, {
                headers: { Authorization: `Bearer ${req.apiToken}` },
            });
            const products = await axios.get(
                `${ECDWID_API_URL}/${req.storeId}/products`,
                {
                    headers: { Authorization: `Bearer ${req.apiToken}` },
                }
            );
            if (ordersRes.data && ordersRes.data.items) {
                const orders = ordersRes.data.items;
                const statistics = calculateTotals(orders);
                res
                    .status(200)
                    .json({
                        ...statistics,
                        totalOrders: ordersRes.data.count,
                        totalProducts: products.data.count,

                    });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Failed to fetch orders", error: error });
        }
    },
    searchOrders: async (req, res) => {
        try {
            const products = req.query.products;
            let query = ''
            if (products) {
                query = `?productId=${products}`
            }
            const orderRes = await axios.get(
                `${ECDWID_API_URL}/${req.storeId}/orders${query}`,
                {
                    headers: { Authorization: `Bearer ${req.apiToken}` },
                }
            );
            res.status(200).json({ orders: orderRes.data.items });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Failed to fetch orders", errorm: error });
        }
    },
    updateOrder: async (req, res) => {
        try {
            const response = await axios.put(
                `${ECDWID_API_URL}/${req.storeId}/orders/${req.params.id}`,
                req.body.payload,
                {
                    headers: { Authorization: `Bearer ${req.apiToken}` },
                }
            );
            res.json(response.data);
        } catch (err) {
            res.status(400).json(err);
            console.log(err);
        }
    },
};

function calculateTotals(orders) {
    let totalTax = 0;
    let totalShipping = 0;
    let totalCurrentRevenue = 0;
    let totalExpectedRevenue = 0;
    let totalDiscount = 0;
    let totalSurcharge = 0;
    let totalCost = 0;

    orders.forEach((order) => {
        console.log(order.paymentStatus, order.total);
        if (order.paymentStatus === "PAID") {
            totalCurrentRevenue += order.total || 0;
        }
        totalExpectedRevenue += order.total || 0;

        // Add tax
        totalTax += order.tax || 0;

        // Add shipping cost
        totalShipping += order.shippingOption.shippingRate || 0;

        // Add total amount

        // Add discounts
        totalDiscount += order.discount || 0;
        // totalSurcharge = totalSurcharge + calculateTotalSurcharge(order.customSurcharges);
        totalCost = totalCost + calculateTotalCost(order.items);
    });

    return {
        totalTax,
        totalShipping,
        totalCurrentRevenue,
        totalDiscount,
        totalSurcharge,
        totalExpectedRevenue,
        totalCost,
    };
}

function calculateTotalSurcharge(surcharges) {
    return surcharges.reduce((total, surcharge) => {
        return total + (surcharge.total || 0);
    }, 0);
}

function calculateTotalCost(items) {
    return items.reduce((costPrice, item) => {
        return costPrice + (item.costPrice || 0);
    }, 0);
}

function getProductsMonthly(products) {
    let productCounts = {};
    let monthNames = [];

    // Get today's date
    let currentDate = new Date();

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
        let date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        let monthKey = date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // e.g., "February 2025"

        productCounts[monthKey] = 0;
        monthNames.push(monthKey);
    }

    // Count products per month
    products.forEach(product => {
        let date = new Date(product.createTimestamp * 1000); // Convert timestamp to Date object
        let monthKey = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        if (monthKey in productCounts) {
            productCounts[monthKey]++;
        }
    });

    // Reverse the order to have the latest month first
    let sortedResult = {};
    monthNames.reverse().forEach(month => {
        sortedResult[month] = productCounts[month];
    });
    return sortedResult
}

function getOrdersMonthly(orders) {
    let orderCounts = {};
    let monthNames = [];

    // Get today's date
    let currentDate = new Date();

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
        let date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        let monthKey = date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // e.g., "February 2025"

        orderCounts[monthKey] = 0;
        monthNames.push(monthKey);
    }

    // Count orders per month
    orders.forEach(order => {
        let date = new Date(order.createDate);
        let monthKey = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        if (monthKey in orderCounts) {
            orderCounts[monthKey]++;
        }
    });

    // Reverse the order to have latest month first
    let sortedResult = {};
    monthNames.reverse().forEach(month => {
        sortedResult[month] = orderCounts[month];
    });
    return sortedResult
}

function calculateLast12MonthsCost(products) {
    let monthlyCost = {};
    let last12Months = getLast12Months();

    // Initialize the last 12 months with 0 cost
    last12Months.forEach(month => monthlyCost[month] = 0);

    products.forEach(product => {
        let date = new Date(product.createTimestamp * 1000);
        let monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // Example: "February 2025"
        let costPrice = product.costPrice;

        if (monthlyCost.hasOwnProperty(monthName)) {
            monthlyCost[monthName] = costPrice + (isNaN(monthlyCost[monthName]) ? 0 : monthlyCost[monthName]);
        }
    });

    return monthlyCost;
}

function calculateLast12MonthsProfit(orders) {
    let monthlyProfit = {};
    let last12Months = getLast12Months();

    // Initialize the last 12 months with 0 cost
    last12Months.forEach(month => monthlyProfit[month] = 0);

    orders.forEach(order => {
        let date = new Date(order.createTimestamp * 1000);
        let monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // Example: "February 2025"
        let total = order.total;

        if (monthlyProfit.hasOwnProperty(monthName)) {
            if (order.paymentStatus === "PAID") {
                monthlyProfit[monthName] = total + monthlyProfit[monthName];
            }
        }
    });

    return monthlyProfit;
}

function getLast12Months() {
    let months = [];
    let date = new Date();
    date.setDate(1); // Set to the first day of the month

    for (let i = 0; i < 12; i++) {
        let monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // Example: "February 2025"
        months.push(monthName);
        date.setMonth(date.getMonth() - 1); // Move to the previous month
    }
    return months;
}