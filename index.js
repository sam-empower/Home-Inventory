// This file serves as a special entry point for Replit deployments
// It instructs Replit to correctly serve the React app

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Serve API requests first
app.use('/api', (req, res) => {
  res.status(404).send({
    error: 'API endpoint not found',
    message: 'Please use the main server for API requests'
  });
});

// Serve static files from the build directory
const staticPath = path.join(__dirname, 'dist/public');
app.use(express.static(staticPath));

// Serve index.html for all routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Static server running on port ${port}`);
});