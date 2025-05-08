// Server for production deployment on Replit
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the dist/public directory
app.use(express.static(path.join(__dirname, 'dist/public')));

// Handle API requests
app.use('/api', (req, res) => {
  // In production, API requests would be handled by the main server
  // This is just a fallback for direct deployed static version
  res.status(404).json({
    error: 'API endpoint not found',
    message: 'This static deployment does not include API endpoints'
  });
});

// For all other requests, send index.html
app.get('*', (req, res) => {
  console.log(`Serving index.html for: ${req.path}`);
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Static server running at port ${port}`);
});