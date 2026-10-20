const db = require('../db');

const gameController = {
  // GET /game/current
  getCurrentGame: async (req, res) => {
    try {
      const result = await db.query(
        'SELECT * FROM games WHERE user_id = $1 AND status = \'active\' LIMIT 1',
        [req.user.userId]
      );
      if (result.rows.length === 0) {
        return res.json(null);
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /game/start
  startGame: async (req, res) => {
    try {
      // Check for existing active game
      const existing = await db.query(
        'SELECT * FROM games WHERE user_id = $1 AND status = \'active\'',
        [req.user.userId]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Already have an active game' });
      }

      const result = await db.query(
        'INSERT INTO games (user_id, status) VALUES ($1, \'active\') RETURNING *',
        [req.user.userId]
      );
      console.log(`[RPS-APP] New game started for user ID: ${req.user.userId}`);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /game/play
  playRound: async (req, res) => {
    const { move } = req.body; // 'rock', 'paper', 'scissors'
    const validMoves = ['rock', 'paper', 'scissors'];
    
    if (!validMoves.includes(move)) {
      return res.status(400).json({ error: 'Invalid move' });
    }

    try {
      // Get current active game
      const gameResult = await db.query(
        'SELECT * FROM games WHERE user_id = $1 AND status = \'active\'',
        [req.user.userId]
      );

      if (gameResult.rows.length === 0) {
        return res.status(404).json({ error: 'No active game found' });
      }

      const game = gameResult.rows[0];
      const cpuMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      
      let result; // 'win', 'loss', 'draw'
      if (move === cpuMove) {
        result = 'draw';
      } else if (
        (move === 'rock' && cpuMove === 'scissors') ||
        (move === 'paper' && cpuMove === 'rock') ||
        (move === 'scissors' && cpuMove === 'paper')
      ) {
        result = 'win';
      } else {
        result = 'loss';
      }

      let updatedScore = game.current_score;
      let updatedStatus = 'active';

      if (result === 'win') {
        updatedScore += 1;
        await db.query(
          'UPDATE games SET current_score = $1 WHERE id = $2',
          [updatedScore, game.id]
        );
      } else if (result === 'loss') {
        updatedStatus = 'finished';
        await db.query(
          'UPDATE games SET status = \'finished\' WHERE id = $1',
          [game.id]
        );
      }

      console.log(`[RPS-APP] Game ${game.id} round: User ${move} vs CPU ${cpuMove} -> ${result}`);
      if (updatedStatus === 'finished') {
          console.log(`[RPS-APP] Game ${game.id} finished. Final score: ${updatedScore}`);
      }

      res.json({
        userMove: move,
        cpuMove,
        result,
        currentScore: updatedScore,
        status: updatedStatus
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /game/quit
  quitGame: async (req, res) => {
    try {
      const result = await db.query(
        'UPDATE games SET status = \'finished\' WHERE user_id = $1 AND status = \'active\' RETURNING *',
        [req.user.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No active game to quit' });
      }
      console.log(`[RPS-APP] User ${req.user.userId} quit active game ${result.rows[0].id}`);
      res.json({ message: 'Game finished', game: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /game/leaderboard
  getLeaderboard: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT u.username, g.current_score, g.created_at 
        FROM games g
        JOIN users u ON g.user_id = u.id
        WHERE g.status = 'finished'
        ORDER BY g.current_score DESC, g.created_at DESC
        LIMIT 5
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = gameController;
