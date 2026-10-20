const db = require('../db');
const fs = require('fs');
const path = require('path');

const LOG_FILE_PATH = '/var/log/rps-central.log';

exports.getAllUsers = async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, role FROM users ORDER BY username ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllGames = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT g.id, u.username, g.current_score, g.status, g.created_at 
            FROM games g 
            JOIN users u ON g.user_id = u.id 
            ORDER BY g.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteGame = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM games WHERE id = $1', [id]);
        res.json({ message: 'Game deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getLogs = async (req, res) => {
    try {
        if (!fs.existsSync(LOG_FILE_PATH)) {
            // Fallback for development/local if file doesn't exist
            return res.json({ logs: ["Log file not found at " + LOG_FILE_PATH, "Make sure central logging is configured."] });
        }

        // Read the last 100 lines
        const logContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
        const lines = logContent.split(/\r?\n|\\n/).filter(line => line.trim() !== '');
        const lastLines = lines.slice(-100).reverse(); // Newest first

        res.json({ logs: lastLines });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read log file: ' + err.message });
    }
};
