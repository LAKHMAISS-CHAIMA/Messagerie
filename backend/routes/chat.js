const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getMessages, getUserRooms } = require('../controllers/chat');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/rooms', authMiddleware, createRoom);

router.post('/join', authMiddleware, joinRoom);

router.get('/rooms/:roomId/messages', authMiddleware, getMessages);

router.get('/rooms/user', authMiddleware, getUserRooms);

module.exports = router;