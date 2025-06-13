const User = require('../models/User');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middlewares/authMiddleware');

exports.register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const user = await User.create({ email, password, username });

    res.status(201).json({
      message: 'User registered',
      user: { email: user.email, username: user.username }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();
    res.json({ message: 'User logged out' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.id;

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: {
          ...(username && { username }),
          ...(email && { email })
        }
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};