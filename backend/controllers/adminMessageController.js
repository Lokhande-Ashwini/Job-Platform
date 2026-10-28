const AdminMessage = require('../models/AdminMessage');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create a new thread (admin initiates, or any participant can start)
exports.createThread = async (req, res) => {
  try {
    const { targetUserId, subject, threadType, message, relatedBooking } = req.body;

    // Validate target user exists
    const target = await User.findById(targetUserId).select('name role');
    if (!target) return res.status(404).json({ message: 'Target user not found' });

    // Check if thread already exists between these two participants
    const existing = await AdminMessage.findOne({
      participants: { $all: [req.user.id, targetUserId] },
    });
    if (existing) {
      // Add message to existing thread instead
      existing.messages.push({ sender: req.user.id, text: message });
      existing.lastMessageAt = new Date();
      await existing.save();
      const populated = await AdminMessage.findById(existing._id)
        .populate('participants', 'name role avatar')
        .populate('messages.sender', 'name role avatar');
      return res.json(populated);
    }

    const thread = await AdminMessage.create({
      threadType: threadType || (req.user.role === 'admin'
        ? (target.role === 'worker' ? 'admin-worker' : 'admin-customer')
        : 'general'),
      participants: [req.user.id, targetUserId],
      subject: subject || `Message from ${req.user.name}`,
      relatedBooking,
      messages: [{ sender: req.user.id, text: message }],
      lastMessageAt: new Date()
    });

    // Notify the other participant
    await Notification.create({
      user: targetUserId,
      title: `New message from ${req.user.name}`,
      message: message.slice(0, 80) + (message.length > 80 ? '…' : ''),
      type: 'message',
      relatedId: thread._id,
    }).catch(() => {});

    const populated = await AdminMessage.findById(thread._id)
      .populate('participants', 'name role avatar')
      .populate('messages.sender', 'name role avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get threads for current user
exports.getThreads = async (req, res) => {
  try {
    const threads = await AdminMessage.find({ participants: req.user.id })
      .populate('participants', 'name role avatar')
      .populate('relatedBooking', 'service scheduledDate')
      .populate('messages.sender', 'name role avatar')
      .sort('-lastMessageAt');
    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get all threads
exports.getAllThreads = async (req, res) => {
  try {
    const threads = await AdminMessage.find()
      .populate('participants', 'name role avatar')
      .populate('relatedBooking', 'service scheduledDate')
      .sort('-lastMessageAt');
    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send a message in a thread
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text required' });

    const thread = await AdminMessage.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const isParticipant = thread.participants.map(p => p.toString()).includes(req.user.id.toString());
    if (!isParticipant) return res.status(403).json({ message: 'Not a participant' });

    thread.messages.push({ sender: req.user.id, text: text.trim() });
    thread.lastMessageAt = new Date();
    await thread.save();

    // Notify other participants
    const otherParticipants = thread.participants.filter(p => p.toString() !== req.user.id.toString());
    for (const pid of otherParticipants) {
      await Notification.create({
        user: pid,
        title: `New message from ${req.user.name}`,
        message: text.slice(0, 80) + (text.length > 80 ? '…' : ''),
        type: 'message',
        relatedId: thread._id,
      }).catch(() => {});
    }

    const populated = await AdminMessage.findById(thread._id)
      .populate('participants', 'name role avatar')
      .populate('messages.sender', 'name role avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single thread with all messages
exports.getThread = async (req, res) => {
  try {
    const thread = await AdminMessage.findById(req.params.threadId)
      .populate('participants', 'name role avatar')
      .populate('messages.sender', 'name role avatar');
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    // Security: only participants or admin can view
    const isParticipant = thread.participants.some(p => p._id.toString() === req.user.id.toString());
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark all messages in a thread as read for the current user
exports.markThreadRead = async (req, res) => {
  try {
    const thread = await AdminMessage.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    const userId = req.user.id.toString();
    let changed = false;
    thread.messages.forEach(m => {
      if (m.sender?.toString() !== userId && !m.isRead) {
        m.isRead = true;
        changed = true;
      }
    });
    if (changed) await thread.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get unread thread count for current user
exports.getUnreadCount = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const count = await AdminMessage.countDocuments({
      participants: uid,
      messages: { $elemMatch: { isRead: false, sender: { $ne: uid } } }
    });
    res.json({ unread: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
