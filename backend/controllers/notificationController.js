const Notification = require('../models/Notification');
const User         = require('../models/User');

/* ── Get notifications (with optional type filter) ──────────────────────── */
exports.getNotifications = async (req, res) => {
  try {
    const { type, limit = 50, skip = 0 } = req.query;
    const filter = { user: req.user.id };
    if (type && type !== 'all') filter.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort('-createdAt').skip(Number(skip)).limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);

    res.json({ notifications, total, unreadCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Mark single as read ────────────────────────────────────────────────── */
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true }
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Mark all as read ───────────────────────────────────────────────────── */
exports.markAllAsRead = async (req, res) => {
  try {
    const { type } = req.body;
    const filter = { user: req.user.id, isRead: false };
    if (type && type !== 'all') filter.type = type;
    await Notification.updateMany(filter, { isRead: true });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Delete single ──────────────────────────────────────────────────────── */
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Delete all (or by type) ────────────────────────────────────────────── */
exports.deleteAll = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user.id };
    if (type && type !== 'all') filter.type = type;
    await Notification.deleteMany(filter);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: broadcast announcement ─────────────────────────────────────── */
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetRole } = req.body; // targetRole: 'all' | 'worker' | 'customer'
    if (!title?.trim() || !message?.trim())
      return res.status(400).json({ message: 'Title and message required' });

    const userFilter = targetRole && targetRole !== 'all' ? { role: targetRole } : {};
    const users = await User.find(userFilter).select('_id');

    const docs = users.map(u => ({
      user:    u._id,
      title:   title.trim(),
      message: message.trim(),
      type:    'announcement',
    }));

    await Notification.insertMany(docs);
    res.json({ sent: docs.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Unread counts across all modules ───────────────────────────────────── */
exports.getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const mongoose = require('mongoose');
    const uid = new mongoose.Types.ObjectId(userId);

    const SupportTicket      = require('../models/SupportTicket');
    const Quote              = require('../models/Quote');
    const Dispute            = require('../models/Dispute');
    const AdminMessage       = require('../models/AdminMessage');
    const Message            = require('../models/Message');
    const WorkerChangeRequest= require('../models/WorkerChangeRequest');

    const [
      notifCount,
      ticketCount,
      quoteCount,
      disputeCount,
      adminMsgCount,
      messageCount,
      pendingChangeRequests,
    ] = await Promise.all([
      Notification.countDocuments({ user: userId, isRead: false }),
      // Count tickets where admin has replied and customer hasn't read
      SupportTicket.countDocuments({
        raisedBy: uid,
        messages: { $elemMatch: { senderRole: 'admin', isRead: false } },
      }).catch(() => 0),
      // Count quotes where user hasn't seen them yet
      Quote.countDocuments({
        $or: [{ customer: uid }, { worker: uid }],
        status: { $in: ['new', 'viewed', 'negotiating', 'admin-review'] },
        seenBy: { $not: { $elemMatch: { $eq: uid } } },
      }).catch(() => 0),
      // Count active disputes involving user that they haven't seen
      Dispute.countDocuments({
        $or: [{ raisedBy: uid }, { against: uid }],
        status: { $in: ['open','under-review','evidence-requested','mediation-in-progress','partial-settlement','reopened','waiting-for-customer','waiting-for-worker'] },
        seenBy: { $not: { $elemMatch: { $eq: uid } } },
      }).catch(() => 0),
      // Count admin message threads with unread messages not sent by user
      AdminMessage.countDocuments({
        participants: uid,
        messages: { $elemMatch: { isRead: false, sender: { $ne: uid } } },
      }).catch(() => 0),
      // Count unread direct messages
      Message.countDocuments({ receiver: uid, isRead: false }).catch(() => 0),
      // Count pending change requests for worker
      WorkerChangeRequest.countDocuments({ worker: uid, status: 'pending' }).catch(() => 0),
    ]);

    res.json({
      notifications: notifCount,
      tickets:       ticketCount,
      quotes:        quoteCount,
      disputes:      disputeCount,
      adminMessages: adminMsgCount,
      messages:      messageCount,
      pendingChangeRequests,
      total: notifCount + ticketCount + quoteCount + disputeCount + adminMsgCount + messageCount + pendingChangeRequests,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
