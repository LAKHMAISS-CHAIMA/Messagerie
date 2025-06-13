// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: [true, 'Please provide a username'],
//     unique: true,
//     trim: true,
//     minlength: [3, 'Username must be at least 3 characters long'],
//     maxlength: [30, 'Username cannot exceed 30 characters']
//   },
//   email: {
//     type: String,
//     required: [true, 'Please provide an email'],
//     unique: true,
//     lowercase: true,
//     trim: true,
//     match: [
//       /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
//       'Please provide a valid email'
//     ]
//   },
//   password: {
//     type: String,
//     required: [true, 'Please provide a password'],
//     minlength: [6, 'Password must be at least 6 characters long']
//   },
//   isOnline: {
//     type: Boolean,
//     default: false
//   },
//   lastSeen: {
//     type: Date,
//     default: Date.now
//   },
//   avatar: {
//     type: String,
//     default: ''
//   },
//   status: {
//     type: String,
//     enum: ['active', 'inactive', 'banned'],
//     default: 'active'
//   }
// }, {
//   timestamps: true
// });

// // Encrypt password before saving
// UserSchema.pre('save', async function(next) {
//   // Only hash the password if it has been modified
//   if (!this.isModified('password')) {
//     return next();
//   }

//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Match password method
// UserSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Remove password from JSON output
// UserSchema.methods.toJSON = function() {
//   const user = this.toObject();
//   delete user.password;
//   return user;
// };

// module.exports = mongoose.model('User', UserSchema);