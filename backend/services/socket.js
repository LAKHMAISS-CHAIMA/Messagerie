const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');
const config = require('../config/config');
const logger = require('../utils/logger');

let io;
const activeRooms = new Map();
const userSockets = new Map();

exports.init = (httpServer) => {
  io = socketIO(httpServer, {
    cors: config.SOCKET_CORS,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      userSockets.set(user._id.toString(), socket.id);
      next();
    } catch (err) {
      logger.error('Socket authentication error:', err);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    logger.info(`New connection: ${socket.id} (User: ${socket.user._id})`);

    socket.on('joinRoom', async (roomCode, callback) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        
        if (!room) {
          return callback({ error: 'Room not found' });
        }

        if (!room.participants.includes(socket.user._id)) {
          room.participants.push(socket.user._id);
          await room.save();
        }

        socket.join(room.code);
        socket.roomCode = room.code;
        activeRooms.set(room.code, {
          roomId: room._id,
          participants: room.participants,
          lastActivity: Date.now()
        });

        socket.to(room.code).emit('userJoined', {
          userId: socket.user._id,
          username: socket.user.username
        });

        callback({ success: true, room });
      } catch (err) {
        logger.error('Error joining room:', err);
        callback({ error: 'Failed to join room' });
      }
    });

    socket.on('sendMessage', async ({ roomCode, content }, callback) => {
      try {
        if (!socket.roomCode || socket.roomCode !== roomCode) {
          return callback({ error: 'Not in this room' });
        }

        const room = await Room.findOne({ code: roomCode });
        if (!room) {
          return callback({ error: 'Room not found' });
        }

        if (!room.participants.includes(socket.user._id)) {
          return callback({ error: 'Not a room participant' });
        }

        const message = new Message({
          content,
          room: room._id,
          sender: socket.user._id
        });
        await message.save();
        await message.populate('sender', 'username');

        if (activeRooms.has(roomCode)) {
          const roomData = activeRooms.get(roomCode);
          roomData.lastActivity = Date.now();
          activeRooms.set(roomCode, roomData);
        }

        io.to(room.code).emit('newMessage', {
          message,
          sender: {
            _id: socket.user._id,
            username: socket.user.username
          }
        });

        callback({ success: true });
      } catch (err) {
        logger.error('Error sending message:', err);
        callback({ error: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ roomCode, isTyping }) => {
      if (socket.roomCode === roomCode) {
        socket.to(roomCode).emit('userTyping', {
          userId: socket.user._id,
          username: socket.user.username,
          isTyping
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Disconnected: ${socket.id} (User: ${socket.user._id})`);
      
      userSockets.delete(socket.user._id.toString());
      
      if (socket.roomCode) {
        socket.to(socket.roomCode).emit('userLeft', {
          userId: socket.user._id,
          username: socket.user.username
        });

        if (activeRooms.has(socket.roomCode)) {
          const roomData = activeRooms.get(socket.roomCode);
          roomData.participants = roomData.participants.filter(
            id => id.toString() !== socket.user._id.toString()
          );
          if (roomData.participants.length === 0) {
            activeRooms.delete(socket.roomCode);
          } else {
            activeRooms.set(socket.roomCode, roomData);
          }
        }
      }
    });
  });

  setInterval(() => {
    const now = Date.now();
    for (const [roomCode, data] of activeRooms.entries()) {
      if (now - data.lastActivity > 24 * 60 * 60 * 1000) { 
        activeRooms.delete(roomCode);
        logger.info(`Cleaned up inactive room: ${roomCode}`);
      }
    }
  }, 60 * 60 * 1000); 
  logger.info('Socket.IO service initialized with in-memory storage');
};

exports.getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

exports.getActiveRooms = () => activeRooms;
exports.getUserSocket = (userId) => userSockets.get(userId.toString());