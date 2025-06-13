const Message = require('../models/messageModel');

function initializeSocket(io) {
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('user_login', (userId) => {
            onlineUsers.set(userId, socket.id);
            io.emit('user_status_change', {
                userId,
                status: 'online'
            });
        });

        socket.on('user_logout', (userId) => {
            onlineUsers.delete(userId);
            io.emit('user_status_change', {
                userId,
                status: 'offline'
            });
        });

        socket.on('send_message', async (data) => {
            try {
                const { senderId, receiverId, content } = data;

                const message = new Message({
                    sender: senderId,
                    receiver: receiverId,
                    content
                });
                await message.save();

                const receiverSocketId = onlineUsers.get(receiverId);

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', {
                        message,
                        senderId
                    });
                }

                socket.emit('message_sent', {
                    message,
                    receiverId
                });
            } catch (error) {
                socket.emit('error', {
                    message: 'Error sending message',
                    error: error.message
                });
            }
        });

        socket.on('typing', (data) => {
            const { senderId, receiverId, isTyping } = data;
            const receiverSocketId = onlineUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user_typing', {
                    senderId,
                    isTyping
                });
            }
        });

        socket.on('disconnect', () => {
            let disconnectedUserId;
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    break;
                }
            }

            if (disconnectedUserId) {
                onlineUsers.delete(disconnectedUserId);
                io.emit('user_status_change', {
                    userId: disconnectedUserId,
                    status: 'offline'
                });
            }
        });
    });
}

module.exports = initializeSocket; 