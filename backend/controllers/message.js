const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'username')
            .populate('receiver', 'username');

        res.json(messages);
    } catch (error) {
        console.error('Error in getMessages:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Error fetching messages',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { senderId, receiverId } = req.params;
        const result = await Message.markAsRead(senderId, receiverId);
        
        res.json({ 
            status: 'success',
            message: 'Messages marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error in markAsRead:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Error marking messages as read',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await Message.getUnreadCount(userId);
        
        res.json({ 
            status: 'success',
            unreadCount: count 
        });
    } catch (error) {
        console.error('Error in getUnreadCount:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Error getting unread count',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 