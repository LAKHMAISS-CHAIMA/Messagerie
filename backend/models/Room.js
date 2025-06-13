const mongoose = require('mongoose');
const config = require('../config/config');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Room name cannot exceed 50 characters']
  },
  code: {
    type: String,
    unique: true,
    uppercase: true,
    length: config.ROOM_CODE_LENGTH || 6
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  maxParticipants: {
    type: Number,
    default: config.MAX_ROOM_PARTICIPANTS || 2
  }
}, {
  timestamps: true
});

// Generate unique room code before saving
RoomSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }

  try {
    let isUnique = false;
    let roomCode;
    
    while (!isUnique) {
      // Generate random room code
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Check if code already exists
      const existingRoom = await this.constructor.findOne({ code: roomCode });
      if (!existingRoom) {
        isUnique = true;
      }
    }
    
    this.code = roomCode;
    next();
  } catch (error) {
    next(error);
  }
});

// Update last activity when accessed
RoomSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Static method to clean inactive rooms
RoomSchema.statics.cleanInactiveRooms = async function() {
  const cutoffDate = new Date(Date.now() - (config.ROOM_INACTIVE_TIMEOUT || 24 * 60 * 60 * 1000));
  
  const result = await this.deleteMany({
    lastActivity: { $lt: cutoffDate },
    isActive: false
  });
  
  return result.deletedCount;
};

// Check if room is full
RoomSchema.methods.isFull = function() {
  return this.participants.length >= this.maxParticipants;
};

// Add participant to room
RoomSchema.methods.addParticipant = function(userId) {
  if (this.isFull()) {
    throw new Error('Room is full');
  }
  
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
  }
  
  this.lastActivity = new Date();
  return this.save();
};

// Remove participant from room
RoomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(id => !id.equals(userId));
  
  // If no participants left, mark as inactive
  if (this.participants.length === 0) {
    this.isActive = false;
  }
  
  this.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.model('Room', RoomSchema);