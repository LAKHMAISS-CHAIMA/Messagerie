const Room = require('../models/Room');
const Message = require('../models/Message');
const socketService = require('../services/socketService');

exports.createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    
    const room = new Room({
      name,
      createdBy: req.user._id,
      participants: [req.user._id]
    });

    await room.save();

    res.status(201).json({
      success: true,
      room
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;
    
    const room = await Room.findOne({ code: roomCode });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    if (!room.participants.includes(req.user._id)) {
      room.participants.push(req.user._id);
      await room.save();
    }

    res.status(200).json({
      success: true,
      room
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('sender', 'username');

    res.status(200).json({
      success: true,
      messages
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

exports.getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ participants: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rooms
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};