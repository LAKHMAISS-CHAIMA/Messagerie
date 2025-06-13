const Room = require('../models/Room');
const User = require('../models/User');

exports.createRoom = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = new Room({ creator: userId });
    await room.save();
    
    res.status(201).json({ 
      code: room.code,
      message: 'Room created successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { code, userId } = req.body;
    const room = await Room.findOne({ code });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.participants.length >= 2) {
      return res.status(400).json({ error: 'Room is full' });
    }

    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      await room.save();
    }

    res.json({ 
      success: true,
      participants: room.participants 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};