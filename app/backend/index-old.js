require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_PORT,
    ECDWID_API_URL,
    SSL_KEY_PATH,
    SSL_CERT_PATH,
    PORT,
    HTTPS_PORT
} = process.env;

// SSL configuration
const sslOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH)
};

// Database connection
const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT || '3306'
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL Connected');
});

/*let STORE_ID = '';
let API_TOKEN = '';
let SECRET_API_TOKEN = '';
let ECDWID_API_URL = process.env.ECDWID_API_URL || 'https://app.ecwid.com/api/v3';*/

app.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        req.apiToken = authHeader.slice(7);
        req.storeId = req.headers['store_id'];
    }
    next();
});

// Fetch products from Ecwid
app.get('/api/products', async (req, res) => {
    try {
        const response = await axios.get(`${ECDWID_API_URL}/${req.storeId}/products`, {
            headers: { Authorization: `Bearer ${req.apiToken}` }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/oauth/token/', async (req, res) => {
    const authorizationCode = req.body.code;

    if (!authorizationCode) {
        return res.status(400).send('Authorization code is missing.');
    }

    try {
        const tokenResponse = await axios.post('https://my.ecwid.com/api/oauth/token', null, {
            params: {
                client_id: req.body.client_id,
                client_secret: req.body.client_secret,
                code: authorizationCode,
                redirect_uri: req.body.redirect_uri,
                grant_type: 'authorization_code',
            },
        });

        const { access_token, token_type, store_id } = tokenResponse.data;

        db.query("DELETE FROM tokens WHERE store_id = ? LIMIT 1", [store_id], (err, result) => {
            if (err) throw err;
        });
        const query = 'INSERT INTO tokens (id, store_id, details) VALUES (?, ?, ?)';
        db.query(query, [0, store_id, JSON.stringify(tokenResponse.data)], (err, result) => {
            if (err) throw err;
        });
        // Store the access token and store ID securely
        // For example, save them to your database
        res.json(tokenResponse.data);
        // res.send('Authorization successful! You can now make API requests to the Ecwid store.');
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error.message);
        res.status(500).send('Failed to fetch access token.');
    }
});

// Update product stock
app.put('/api/products/:id/stock', async (req, res) => {
    const { id } = req.params;
    let { stock } = req.body;
    // Convert stock to a number (if it's a string)
    stock = parseInt(stock, 10);
    try {
        const response = await axios.put(
            `${ECDWID_API_URL}/${req.storeId}/products/${id}`,
            { quantity: stock },
            { headers: { Authorization: `Bearer ${req.apiToken}` } }
        );
        res.json(response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Response:', error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            console.error('No Response:', error.request);
            res.status(500).json({ error: 'No response received from Ecwid' });
        } else {
            console.error('Error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }


});

// Delete product
app.delete('/api/products/:id/', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.delete(
            `${ECDWID_API_URL}/${req.storeId}/products/${id}`,
            { headers: { Authorization: `Bearer ${req.apiToken}` } }
        );
        db.query("DELETE FROM bundles WHERE ecwid_id = ? LIMIT 1", [id], (err, result) => {
            if (err) throw err;
        });
        res.json(response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Response:', error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            console.error('No Response:', error.request);
            res.status(500).json({ error: 'No response received from Ecwid' });
        } else {
            console.error('Error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }


});


// Create a bundle (store in local database)
app.post('/api/bundles', async (req, res) => {
    const { name, productIds, discount, sku } = req.body;
    const query = 'INSERT INTO bundles (name, product_ids, store_id, discount, sku, quantity, price, ecwid_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const prod_ids = productIds.join(',');

    const response = await axios.get(`${ECDWID_API_URL}/${req.storeId}/products?productId=${prod_ids}`, {
        headers: { Authorization: `Bearer ${req.apiToken}` }
    });
    // console.log(response);
    let price = 0;
    for(index=0;index < response.data.items.length; index++)
        price += response.data.items[index].price;

    price -= (price * (discount / 100));

    db.query(query, [name, JSON.stringify(productIds), req.storeId, discount, sku, 1,price, 0], (err, result) => {
        if (err) throw err;

        try {
            axios.post(
                `${ECDWID_API_URL}/${req.storeId}/products`,
                {
                    name,
                    price,
                    description: "-",
                    enabled: true, // Product will be visible in store
                    sku
                },
                { headers: { Authorization: `Bearer ${req.apiToken}` }}
            ).then(function (response) {
                //console.log(response.data);

                db.query("UPDATE bundles SET ecwid_id = ? WHERE id = ? LIMIT 1", [response.data.id, result.insertId], (err, result) => {
                    if (err) throw err;
                });

            });
        } catch (error) {
            if (error.response) {
                console.error('Error Response:', error.response.status, error.response.data);
                res.status(error.response.status).json(error.response.data);
            } else if (error.request) {
                console.error('No Response:', error.request);
                res.status(500).json({ error: 'No response received from Ecwid' });
            } else {
                console.error('Error:', error.message);
                res.status(500).json({ error: error.message });
            }
        }

        res.json({ id: result.insertId, name, product_ids: productIds, discount });
    });
});


app.put('/api/bundles/:id/', async (req, res) => {
    const { name, productIds, discount, sku } = req.body;
    const { id } = req.params;

    const prod_ids = productIds.join(',');

    const response = await axios.get(`${ECDWID_API_URL}/${req.storeId}/products?productId=${prod_ids}`, {
        headers: { Authorization: `Bearer ${req.apiToken}` }
    });
    // console.log(response);
    let price = 0;
    for(index=0;index < response.data.items.length; index++)
        price += response.data.items[index].price;

    price -= (price * (discount / 100));

    const query = 'UPDATE bundles SET name = ?,  product_ids = ?, discount = ?, sku = ?, price=? WHERE id= ? LIMIT 1';
    db.query(query, [name, JSON.stringify(productIds), discount, sku, price, id], (err, result) => {
        if (err) throw err;

        try {

            db.query("SELECT * FROM bundles WHERE id = ? LIMIT 1", [id], (err, result) => {
                if (err) throw err;

                axios.put(
                    `${ECDWID_API_URL}/${req.storeId}/products/`+result[0].ecwid_id,
                    {
                        name,
                        price,
                        description: "testing bundles",
                        enabled: true, // Product will be visible in store
                        sku
                    },
                    { headers: { Authorization: `Bearer ${req.apiToken}` }}
                );
            });


        } catch (error) {
            if (error.response) {
                console.error('Error Response:', error.response.status, error.response.data);
                res.status(error.response.status).json(error.response.data);
            } else if (error.request) {
                console.error('No Response:', error.request);
                res.status(500).json({ error: 'No response received from Ecwid' });
            } else {
                console.error('Error:', error.message);
                res.status(500).json({ error: error.message });
            }
        }

        res.json({ id: result.insertId, name, product_ids: productIds, discount });
    });
});

// Delete product
app.delete('/api/bundles/:id/', async (req, res) => {
    const { id } = req.params;

    try {
        db.query("SELECT * FROM bundles WHERE id = ? LIMIT 1", [id], (err, result) => {
            if (err) throw err;
            const response = axios.delete(
                `${ECDWID_API_URL}/${req.storeId}/products/`+result[0].ecwid_id,
                {headers: {Authorization: `Bearer ${req.apiToken}`}}
            );
            db.query("DELETE FROM bundles WHERE id = ? LIMIT 1", [id], (err, result) => {
                if (err) throw err;
            });
            res.json(response.data);
        });

    } catch (error) {
        if (error.response) {
            console.error('Error Response:', error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            console.error('No Response:', error.request);
            res.status(500).json({ error: 'No response received from Ecwid' });
        } else {
            console.error('Error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }


});


// get all bundles from local Database
app.get('/api/bundles', (req, res) => {
    const query = 'SELECT * FROM bundles WHERE store_id = ?';

    db.query(query, [req.storeId], (err, result) => {
        if (err) throw err;
        res.json({ bundles: result, total: result.length});
    });
});

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, app);
httpsServer.listen(HTTPS_PORT || 3339, () => {
    console.log(`HTTPS Server running on port ${HTTPS_PORT || 3339}`);
});

// Start HTTP server
app.listen(PORT || 3338, () => {
    console.log(`HTTP Server running on port ${PORT || 3338}`);
});