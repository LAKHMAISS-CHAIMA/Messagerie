const express = require('express');
const router = express.Router();
const { createRoom, joinRoom } = require('../controllers/room');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, createRoom);

router.post('/join', authMiddleware, joinRoom);

module.exports = router;