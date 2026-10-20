const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// All game routes require authentication
router.get('/current', gameController.getCurrentGame);
router.post('/start', gameController.startGame);
router.post('/play', gameController.playRound);
router.post('/quit', gameController.quitGame);
router.get('/leaderboard', gameController.getLeaderboard);

module.exports = router;
