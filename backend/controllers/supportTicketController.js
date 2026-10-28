const SupportTicket = require('../models/SupportTicket');
const Notification  = require('../models/Notification');

const notify = async (userId, title, message, relatedId) => {
  await Notification.create({ user: userId, title, message, type: 'system', relatedId }).catch(() => {});
};

// ── Customer / Worker: create ticket ─────────────────────────────────────────
exports.createTicket = async (req, res) => {
  try {
    const { subject, category, description, priority, bookingId, bookingRef, screenshotUrl } = req.body;
    const role = req.user.role === 'worker' ? 'worker' : 'customer';
    const ticket = await SupportTicket.create({
      raisedBy:     req.user.id,
      raisedByRole: role,
      customer:     req.user.id,
      subject,
      category:     category || 'other',
      description,
      priority:     priority || 'medium',
      booking:      bookingId || undefined,
      bookingRef:   bookingRef || undefined,
      screenshotUrl: screenshotUrl || undefined,
    });
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Customer / Worker: get own tickets ───────────────────────────────────────
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ raisedBy: req.user.id })
      .populate('booking', 'service scheduledDate amount')
      .sort('-updatedAt');
    res.json(tickets);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Anyone: get single ticket ─────────────────────────────────────────────────
exports.getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('raisedBy',        'name email phone avatar role')
      .populate('assignedAdmin',   'name avatar')
      .populate('messages.sender', 'name role avatar')
      .populate('adminNotes.admin','name')
      .populate('booking',         'service scheduledDate amount paymentStatus');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const isOwner = ticket.raisedBy._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Anyone: send message in ticket ───────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { text, isInternal } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text required' });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const isOwner = ticket.raisedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const senderRole = isAdmin ? 'admin' : ticket.raisedByRole;
    const internal   = isAdmin && isInternal ? true : false;

    ticket.messages.push({ sender: req.user.id, senderRole, text: text.trim(), isInternal: internal });
    ticket.updatedAt = new Date();

    if (isAdmin) {
      if (!ticket.firstResponseAt) ticket.firstResponseAt = new Date();
      if (['open', 'waiting-for-admin'].includes(ticket.status)) ticket.status = 'in-progress';
    } else {
      if (ticket.status === 'waiting-for-user') ticket.status = 'in-progress';
    }

    await ticket.save();

    if (!internal) {
      const notifyTarget = isAdmin ? ticket.raisedBy : null;
      if (notifyTarget) {
        await notify(notifyTarget, 'Support Reply', `New reply on ticket: "${ticket.subject}"`, ticket._id);
      }
    }

    const populated = await SupportTicket.findById(ticket._id)
      .populate('raisedBy',        'name email phone avatar role')
      .populate('assignedAdmin',   'name avatar')
      .populate('messages.sender', 'name role avatar')
      .populate('adminNotes.admin','name')
      .populate('booking',         'service scheduledDate amount paymentStatus');
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Admin: get all tickets with filters + search ──────────────────────────────
exports.getAllTickets = async (req, res) => {
  try {
    const { status, priority, category, raisedByRole, search } = req.query;
    const filter = {};
    if (status)       filter.status       = status;
    if (priority)     filter.priority     = priority;
    if (category)     filter.category     = category;
    if (raisedByRole) filter.raisedByRole = raisedByRole;

    let tickets = await SupportTicket.find(filter)
      .populate('raisedBy',      'name email phone avatar role')
      .populate('assignedAdmin', 'name avatar')
      .populate('booking',       'service scheduledDate amount')
      .sort('-updatedAt');

    if (search) {
      const q = search.toLowerCase();
      tickets = tickets.filter(t =>
        t.subject?.toLowerCase().includes(q) ||
        t.raisedBy?.name?.toLowerCase().includes(q) ||
        t.raisedBy?.email?.toLowerCase().includes(q) ||
        t._id.toString().includes(q) ||
        t.booking?._id?.toString().includes(q) ||
        t.bookingRef?.toLowerCase().includes(q)
      );
    }

    res.json(tickets);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Admin: update ticket (status, note, priority, tags) ───────────────────────
exports.updateTicket = async (req, res) => {
  try {
    const { status, resolutionNote, priority, tags } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (status) {
      ticket.status = status;
      if (['resolved', 'closed'].includes(status)) ticket.resolvedAt = new Date();
    }
    if (resolutionNote) ticket.resolutionNote = resolutionNote;
    if (priority)       ticket.priority       = priority;
    if (tags)           ticket.tags           = tags;
    ticket.updatedAt = new Date();
    await ticket.save();

    const labels = {
      resolved: 'Resolved ✓', closed: 'Closed', escalated: 'Escalated ⚠️',
      'in-progress': 'In Progress', 'waiting-for-user': 'Waiting for your reply',
      'waiting-for-admin': 'Waiting for admin'
    };
    await notify(ticket.raisedBy, 'Support Ticket Updated',
      `Ticket "${ticket.subject}" — ${labels[status] || status}`, ticket._id);

    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Admin: assign ticket to self ──────────────────────────────────────────────
exports.assignToSelf = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { assignedAdmin: req.user.id, updatedAt: new Date() },
      { new: true }
    ).populate('assignedAdmin', 'name avatar');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Admin: add internal note ──────────────────────────────────────────────────
exports.addInternalNote = async (req, res) => {
  try {
    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ message: 'Note text required' });
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.adminNotes.push({ note: note.trim(), admin: req.user.id });
    ticket.updatedAt = new Date();
    await ticket.save();
    const populated = await SupportTicket.findById(ticket._id).populate('adminNotes.admin', 'name');
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Admin: escalate ticket ────────────────────────────────────────────────────
exports.escalateTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status: 'escalated', updatedAt: new Date() },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    await notify(ticket.raisedBy, 'Ticket Escalated',
      `Your ticket "${ticket.subject}" has been escalated for priority review.`, ticket._id);
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Admin: reopen ticket ──────────────────────────────────────────────────────
exports.reopenTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status: 'open', reopenedAt: new Date(), resolvedAt: null, updatedAt: new Date() },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    await notify(ticket.raisedBy, 'Ticket Reopened',
      `Your ticket "${ticket.subject}" has been reopened.`, ticket._id);
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Admin: convert to dispute ─────────────────────────────────────────────────
exports.convertToDispute = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.convertedTo  = 'dispute';
    ticket.status       = 'escalated';
    ticket.updatedAt    = new Date();
    await ticket.save();
    await notify(ticket.raisedBy, 'Ticket Converted to Dispute',
      `Your support ticket "${ticket.subject}" has been converted to a formal dispute.`, ticket._id);
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Admin: convert to refund review ──────────────────────────────────────────
exports.convertToRefund = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.convertedTo = 'refund-review';
    ticket.status      = 'in-progress';
    ticket.updatedAt   = new Date();
    await ticket.save();
    await notify(ticket.raisedBy, 'Refund Review Started',
      `Your ticket "${ticket.subject}" has been moved to refund review.`, ticket._id);
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Mark messages as read ─────────────────────────────────────────────────────
exports.markTicketRead = async (req, res) => {
  try {
    const ticket  = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const isAdmin = req.user.role === 'admin';
    let changed   = false;
    ticket.messages.forEach(m => {
      const shouldMark = isAdmin ? m.senderRole !== 'admin' : m.senderRole === 'admin';
      if (shouldMark && !m.isRead && !m.isInternal) { m.isRead = true; changed = true; }
    });
    if (changed) await ticket.save();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Admin: ticket stats ───────────────────────────────────────────────────────
exports.getTicketStats = async (req, res) => {
  try {
    const [total, open, inProgress, resolved, closed, escalated, byWorker, byCustomer, highPriority] =
      await Promise.all([
        SupportTicket.countDocuments(),
        SupportTicket.countDocuments({ status: 'open' }),
        SupportTicket.countDocuments({ status: 'in-progress' }),
        SupportTicket.countDocuments({ status: 'resolved' }),
        SupportTicket.countDocuments({ status: 'closed' }),
        SupportTicket.countDocuments({ status: 'escalated' }),
        SupportTicket.countDocuments({ raisedByRole: 'worker' }),
        SupportTicket.countDocuments({ raisedByRole: 'customer' }),
        SupportTicket.countDocuments({ priority: 'high', status: { $in: ['open', 'in-progress', 'escalated'] } }),
      ]);
    res.json({ total, open, inProgress, resolved, closed, escalated, byWorker, byCustomer, highPriority });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
