const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, location, workerProfile } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Normalize location — ensure coordinates are valid numbers
    let normalizedLocation;
    if (location && location.coordinates) {
      const [lng, lat] = location.coordinates;
      normalizedLocation = {
        type: 'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        pincode: location.pincode || '',
      };
    }

    const user = await User.create({
      name, email, password, phone, role,
      location: normalizedLocation,
      workerProfile
    });

    const token = generateToken(user._id);
    res.status(201).json({ token, user: { id: user._id, name, email, role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update worker online status
    if (user.role === 'worker') {
      user.workerProfile.isOnline = true;
      user.workerProfile.lastSeen = new Date();
      await user.save();
    }

    const token = generateToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // Mark worker as offline
    if (req.user?.role === 'worker') {
      await User.findByIdAndUpdate(req.user.id, {
        'workerProfile.isOnline': false,
        'workerProfile.lastSeen': new Date(),
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const { getCustomerCompletion, getWorkerCompletion, getAdminCompletion } = require('../utils/profileCompletion');
    let completion;
    if (user.role === 'worker') completion = getWorkerCompletion(user);
    else if (user.role === 'admin') completion = getAdminCompletion(user);
    else completion = getCustomerCompletion(user);

    const userObj = user.toObject();
    userObj.profileCompletion = completion;
    // Flatten location fields for easy frontend access
    if (user.location) {
      userObj.address = user.location.address || '';
      userObj.city    = user.location.city    || '';
      userObj.state   = user.location.state   || '';
      userObj.pincode = user.location.pincode || '';
    }

    // Compute trust score using live booking data
    if (user.role === 'worker') {
      const { computeWorkerTrustScore } = require('../utils/trustScore');
      userObj.trustScore = await computeWorkerTrustScore(user);
    } else if (user.role === 'customer') {
      const { computeCustomerTrustScore } = require('../utils/trustScore');
      userObj.trustScore = await computeCustomerTrustScore(user);
      // Add total bookings count for customer overview
      const Booking = require('../models/Booking');
      userObj.totalBookings = await Booking.countDocuments({ customer: user._id });
    }

    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate name
    if (name !== undefined) {
      if (!name || name.trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters' });
      user.name = name.trim();
    }

    // Validate phone
    if (phone !== undefined) {
      const phoneClean = phone.replace(/\s/g, '');
      if (phoneClean && phoneClean.length < 10) return res.status(400).json({ message: 'Phone number must be at least 10 digits' });
      user.phone = phoneClean;
    }

    // Validate and update email
    if (email !== undefined && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email address' });
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ message: 'Email is already in use by another account' });
      user.email = email.toLowerCase().trim();
    }

    await user.save();
    const u = user.toObject(); delete u.password;
    res.json(u);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user.id);
    if (!(await user.comparePassword(currentPassword))) return res.status(401).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
