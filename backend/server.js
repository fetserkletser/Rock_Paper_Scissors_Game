require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const adminRoutes = require('./routes/adminRoutes');
const db = require('./db');
const authMiddleware = require('./middleware/authMiddleware');

// Intercept console.log to write [RPS-APP] entries to central log file if it exists
const LOG_FILE_PATH = '/var/log/rps-central.log';
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
  try {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE_PATH, `${timestamp} ${msg}\n`);
  } catch (_) {}
};

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/game', authMiddleware, gameRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Rock Paper Scissors Backend is running.');
});

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      tier: 'backend',
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      tier: 'backend',
      database: 'disconnected',
      error: err.message
    });
  }
});

// Protected route example for verification
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, role FROM users WHERE id = $1', [req.user.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[RPS-APP] Backend listening at http://0.0.0.0:${port}`);
});
