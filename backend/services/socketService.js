const socketIO = require('socket.io');
const config = require('../config/config');
const logger = require('../utils/logger');
const Room = require('../models/Room');
const Message = require('../models/Message');

class SocketService {
    constructor() {
        this.io = null;
        this.rooms = new Map(); 
        this.userSockets = new Map();
    }

    initialize(server) {
        this.io = socketIO(server, {
            cors: config.SOCKET_CORS,
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.setupSocketHandlers();
        logger.info('Socket.IO service initialized with in-memory storage');
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`New client connected: ${socket.id}`);

            socket.on('join_room', async ({ roomId, userId }) => {
                try {
                    const room = await Room.findById(roomId);
                    if (!room) {
                        socket.emit('error', { message: 'Room not found' });
                        return;
                    }

                    if (!room.participants.includes(userId)) {
                        socket.emit('error', { message: 'Not authorized to join this room' });
                        return;
                    }

                    this.userSockets.set(userId, socket.id);

                    socket.join(roomId);
                    
                    if (!this.rooms.has(roomId)) {
                        this.rooms.set(roomId, new Set());
                    }
                    this.rooms.get(roomId).add(userId);
                                        const messages = await Message.find({ room: roomId })
                        .sort({ createdAt: -1 })
                        .limit(50)
                        .populate('sender', 'username');

                    socket.emit('room_messages', messages);
                    socket.to(roomId).emit('user_joined', { userId, socketId: socket.id });
                } catch (error) {
                    logger.error('Error joining room:', error);
                    socket.emit('error', { message: 'Error joining room' });
                }
            });

            socket.on('leave_room', ({ roomId, userId }) => {
                socket.leave(roomId);
                
                if (this.rooms.has(roomId)) {
                    this.rooms.get(roomId).delete(userId);
                    if (this.rooms.get(roomId).size === 0) {
                        this.rooms.delete(roomId);
                    }
                }
                
                socket.to(roomId).emit('user_left', { userId, socketId: socket.id });
            });

            socket.on('send_message', async ({ roomId, userId, content }) => {
                try {
                    const message = new Message({
                        room: roomId,
                        sender: userId,
                        content
                    });

                    await message.save();
                    await message.populate('sender', 'username');

                    this.io.to(roomId).emit('new_message', message);
                } catch (error) {
                    logger.error('Error sending message:', error);
                    socket.emit('error', { message: 'Error sending message' });
                }
            });

            socket.on('typing', ({ roomId, userId, isTyping }) => {
                socket.to(roomId).emit('user_typing', { userId, isTyping });
            });

            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
                
                for (const [userId, socketId] of this.userSockets.entries()) {
                    if (socketId === socket.id) {
                        this.userSockets.delete(userId);
                        break;
                    }
                }
                
                for (const [roomId, users] of this.rooms.entries()) {
                    for (const userId of users) {
                        if (this.userSockets.get(userId) === socket.id) {
                            users.delete(userId);
                            if (users.size === 0) {
                                this.rooms.delete(roomId);
                            }
                        }
                    }
                }
            });
        });
    }

    emitToRoom(roomId, event, data) {
        if (this.io) {
            this.io.to(roomId).emit(event, data);
        }
    }

    getRoomParticipants(roomId) {
        return this.rooms.get(roomId) || new Set();
    }

    isUserInRoom(userId, roomId) {
        return this.rooms.has(roomId) && this.rooms.get(roomId).has(userId);
    }
}

module.exports = new SocketService(); 