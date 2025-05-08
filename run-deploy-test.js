// Simple script to test deployment server
const express = require('express');
const path = require('path');
const app = express();
const port = 8000; // Different port to avoid conflict

console.log('Starting deployment test server...');

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[TEST] ${req.method} ${req.path}`);
  next();
});

// Serve the static test page
app.use(express.static(path.join(__dirname, 'static_deploy')));

// For all other requests, send index.html
app.get('*', (req, res) => {
  console.log(`[TEST] Serving index.html for: ${req.path}`);
  res.sendFile(path.join(__dirname, 'static_deploy/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Test deployment server running at http://localhost:${port}`);
  console.log(`Try accessing these routes to verify SPA routing works:`);
  console.log(`http://localhost:${port}/test`);
  console.log(`http://localhost:${port}/items`);
  console.log(`http://localhost:${port}/settings`);
});