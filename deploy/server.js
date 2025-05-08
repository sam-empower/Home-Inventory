// Minimal server for testing client-side routing in production
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// For all other requests, send index.html
app.get('*', (req, res) => {
  console.log(`Serving index.html for: ${req.path}`);
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Test deployment server running at port ${port}`);
});