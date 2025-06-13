const express = require('express');
const router = express.Router();
const { getMessages, markAsRead, getUnreadCount } = require('../controllers/message');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:userId1/:userId2', authMiddleware, getMessages);

router.put('/read/:senderId/:receiverId', authMiddleware, markAsRead);

router.get('/unread/:userId', authMiddleware, getUnreadCount);

module.exports = router;