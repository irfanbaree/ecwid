<?php
// Destination webhook URL
$destination_url = 'https://app.bundlefix.com:3339/api/webhook';

// Capture the raw JSON body from the incoming request
$json_input = file_get_contents('php://input');

// Initialize cURL session
$ch = curl_init($destination_url);

// Set cURL options to forward the JSON request
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $json_input); // Send the JSON data
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json', // Ensure the request is sent as JSON
    'Content-Length: ' . strlen($json_input) // Set correct content length
]);

// Execute the request and capture the response
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Close the cURL session
curl_close($ch);

// Send the response from the external API back to the client
http_response_code($http_code);
echo $response;
