const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;
const backendUrl = process.env.BACKEND_URL || 'http://backend:4000';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', tier: 'frontend' });
});

// Reverse proxy for /api requests to the backend service
app.use('/api', (req, res) => {
  try {
    const backend = new URL(backendUrl);
    const options = {
      hostname: backend.hostname,
      port: backend.port || (backend.protocol === 'https:' ? 443 : 80),
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: backend.host,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error(`[Frontend Proxy Error] Could not connect to backend at ${backendUrl}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Backend unreachable', details: err.message });
      }
    });

    req.pipe(proxyReq, { end: true });
  } catch (err) {
    console.error('[Frontend Proxy Error]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal proxy configuration error' });
    }
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[RPS-APP] Frontend listening at http://0.0.0.0:${port}`);
});
