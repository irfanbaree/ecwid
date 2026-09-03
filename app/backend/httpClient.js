// httpClient.js
const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
    keepAlive: false,  // critical: closes sockets after request
    maxSockets: 50,
    timeout: 15000
});

const httpClient = axios.create({
    httpsAgent: agent,
    timeout: 15000
});

module.exports = httpClient;