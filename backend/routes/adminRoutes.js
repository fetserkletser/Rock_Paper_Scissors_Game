const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All routes here require 'admin' role
router.use(authMiddleware, roleMiddleware(['admin']));

router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/games', adminController.getAllGames);
router.delete('/games/:id', adminController.deleteGame);
router.get('/logs', adminController.getLogs);

module.exports = router;
