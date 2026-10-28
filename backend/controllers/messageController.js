const Message = require('../models/Message');
const Notification = require('../models/Notification');

exports.sendMessage = async (req, res) => {
  try {
    const { bookingId, receiverId, message } = req.body;
    const newMessage = await Message.create({
      booking: bookingId,
      sender: req.user.id,
      receiver: receiverId,
      message
    });
    await Notification.create({
      user: receiverId,
      title: 'New Message',
      message: `You have a new message from ${req.user.name}`,
      type: 'message',
      relatedId: bookingId
    });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const messages = await Message.find({ booking: bookingId })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort('createdAt');
    // Auto-mark as read when fetched
    await Message.updateMany(
      { booking: bookingId, receiver: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Total unread message count for current user
exports.getUnreadMessageCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user.id, isRead: false });
    res.json({ unread: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// All conversations with per-booking unread count
exports.getConversations = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const uid = new mongoose.Types.ObjectId(req.user.id);

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: uid }, { receiver: uid }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$booking',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', uid] }, { $eq: ['$isRead', false] }] },
                1, 0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    await Message.populate(conversations, [
      { path: 'lastMessage.sender', select: 'name avatar role' },
      { path: 'lastMessage.receiver', select: 'name avatar role' },
    ]);

    const Booking = require('../models/Booking');
    const bookingIds = conversations.map(c => c._id).filter(Boolean);
    const bookings = await Booking.find({ _id: { $in: bookingIds } })
      .populate('customer', 'name avatar')
      .populate('worker', 'name avatar')
      .select('service customer worker status');

    const bookingMap = {};
    bookings.forEach(b => { bookingMap[b._id.toString()] = b; });

    const result = conversations.map(c => ({
      bookingId: c._id,
      booking: bookingMap[c._id?.toString()] || null,
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
