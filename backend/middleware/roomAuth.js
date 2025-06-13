const Room = require('../models/Room');

module.exports = async (req, res, next) => {
  try {
    const room = await Room.findOne({ 
      code: req.params.code,
      participants: req.user.id 
    });
    
    if (!room) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    req.room = room;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};