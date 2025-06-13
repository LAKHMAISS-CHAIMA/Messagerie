const mongoose = require('mongoose');
const config = require('../config/config');

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [config.MAX_MESSAGE_LENGTH || 1000, `Message cannot exceed ${config.MAX_MESSAGE_LENGTH || 1000} characters`]
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
MessageSchema.index({ room: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, read: 1 });

// Mark message as read
MessageSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Edit message
MessageSchema.methods.editMessage = function(newContent) {
  this.content = newContent;
  this.edited = true;
  this.editedAt = new Date();
  return this.save();
};

// Soft delete message
MessageSchema.methods.softDelete = function() {
  this.deleted = true;
  this.deletedAt = new Date();
  this.content = 'This message has been deleted';
  return this.save();
};

// Static method to clean old messages
MessageSchema.statics.cleanOldMessages = async function() {
  const cutoffDate = new Date(Date.now() - (config.MESSAGE_CLEANUP_AGE || 30 * 24 * 60 * 60 * 1000));
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    deleted: true
  });
  
  return result.deletedCount;
};

// Static method to get conversation between two users
MessageSchema.statics.getConversation = function(userId1, userId2, options = {}) {
  const { limit = 50, skip = 0 } = options;
  
  return this.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 }
    ],
    deleted: false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .populate('sender', 'username avatar')
  .populate('receiver', 'username avatar');
};

// Static method to get room messages
MessageSchema.statics.getRoomMessages = function(roomId, options = {}) {
  const { limit = 50, skip = 0 } = options;
  
  return this.find({
    room: roomId,
    deleted: false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .populate('sender', 'username avatar');
};

// Static method to count unread messages for a user
MessageSchema.statics.countUnreadMessages = function(userId) {
  return this.countDocuments({
    receiver: userId,
    read: false,
    deleted: false
  });
};

module.exports = mongoose.model('Message', MessageSchema);