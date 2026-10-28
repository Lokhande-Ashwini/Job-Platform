const Dispute      = require('../models/Dispute');
const Booking      = require('../models/Booking');
const Notification = require('../models/Notification');
const User         = require('../models/User');

const notify = async (userId, title, message, relatedId) => {
  await Notification.create({ user: userId, title, message, type: 'system', relatedId }).catch(() => {});
};

const addActivity = (dispute, action, userId, role, note, isInternal = false) => {
  dispute.activity.push({ action, by: userId, byRole: role, note, isInternal, at: new Date() });
  dispute.updatedAt = new Date();
};

const populateDispute = (q) =>
  q.populate('booking',       'service scheduledDate amount paymentStatus isEmergency')
   .populate('raisedBy',      'name email phone role avatar')
   .populate('against',       'name email phone role avatar')
   .populate('assignedAdmin', 'name avatar')
   .populate('resolvedBy',    'name')
   .populate('activity.by',   'name role')
   .populate('linkedTicket',  'subject status')
   .populate('suspendedUser', 'name role');

/* ── Customer / Worker: create dispute ─────────────────────────────────── */
exports.createDispute = async (req, res) => {
  try {
    const { bookingId, reason, description, issueType } = req.body;
    const booking = await Booking.findById(bookingId).populate('customer worker');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const against = req.user.role === 'customer' ? booking.worker._id : booking.customer._id;

    const dispute = await Dispute.create({
      booking:   bookingId,
      raisedBy:  req.user.id,
      against,
      reason,
      description,
      issueType: issueType || 'other',
      activity:  [{ action: 'Dispute raised', by: req.user.id, byRole: req.user.role, note: description.slice(0, 120), at: new Date() }],
    });

    await Booking.findByIdAndUpdate(bookingId, { hasDispute: true, status: 'disputed' });

    await notify(against, '⚠️ Dispute Raised Against You',
      `A dispute has been raised regarding "${booking.service}". Reason: ${reason}`, dispute._id);

    const populated = await populateDispute(Dispute.findById(dispute._id));
    res.status(201).json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Get my disputes ────────────────────────────────────────────────────── */
exports.getMyDisputes = async (req, res) => {
  try {
    const disputes = await populateDispute(
      Dispute.find({ $or: [{ raisedBy: req.user.id }, { against: req.user.id }] }).sort('-updatedAt')
    );
    res.json(disputes);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: get all disputes ────────────────────────────────────────────── */
exports.getAllDisputes = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;

    let disputes = await populateDispute(Dispute.find(filter).sort('-updatedAt'));

    if (search) {
      const q = search.toLowerCase();
      disputes = disputes.filter(d =>
        d.raisedBy?.name?.toLowerCase().includes(q) ||
        d.against?.name?.toLowerCase().includes(q)  ||
        d.reason?.toLowerCase().includes(q)          ||
        d.booking?.service?.toLowerCase().includes(q)||
        d._id.toString().includes(q)
      );
    }

    res.json(disputes);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: full action handler ─────────────────────────────────────────── */
exports.updateDisputeStatus = async (req, res) => {
  try {
    const {
      status, resolutionNote, refundAmount, penaltyAmount,
      settlementAmount, warningNote, actionNote, priority,
      isInternal,
    } = req.body;

    const dispute = await Dispute.findById(req.params.id).populate('raisedBy against booking');
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    const prevStatus = dispute.status;

    if (status)           dispute.status         = status;
    if (priority)         dispute.priority        = priority;
    if (resolutionNote)   dispute.resolutionNote  = resolutionNote;
    if (refundAmount  !== undefined) dispute.refundAmount     = Number(refundAmount);
    if (penaltyAmount !== undefined) dispute.penaltyAmount    = Number(penaltyAmount);
    if (settlementAmount !== undefined) dispute.settlementAmount = Number(settlementAmount);
    if (warningNote)      dispute.warningNote     = warningNote;
    dispute.resolvedBy = req.user.id;
    dispute.assignedAdmin = req.user.id;

    if (['resolved-customer','resolved-worker','closed','partial-settlement'].includes(status)) {
      dispute.resolvedAt = new Date();
    }
    if (status === 'open' && prevStatus !== 'open') dispute.reopenedAt = new Date();

    const actNote = actionNote || resolutionNote || '';
    addActivity(dispute,
      status ? `Status: ${prevStatus} → ${status}` : `Action by admin`,
      req.user.id, 'admin', actNote, isInternal || false
    );

    await dispute.save();

    // Notifications
    const statusMessages = {
      'under-review':         'Your dispute is now under review.',
      'waiting-for-customer': 'Admin needs more information from you.',
      'waiting-for-worker':   'Admin needs more information from the worker.',
      'evidence-requested':   'Additional evidence has been requested for your dispute.',
      'mediation-in-progress':'Your dispute has entered mediation.',
      'partial-settlement':   `A partial settlement of ₹${settlementAmount || 0} has been proposed.`,
      'resolved-customer':    `Dispute resolved in your favour.${refundAmount > 0 ? ` Refund: ₹${refundAmount}` : ''}`,
      'resolved-worker':      'Dispute resolved in favour of the worker.',
      'closed':               'Your dispute has been closed.',
      'escalated':            'Your dispute has been escalated for priority review.',
      'open':                 'Your dispute has been reopened.',
    };

    if (!isInternal) {
      const msg = statusMessages[status] || `Dispute updated: ${status || 'action taken'}`;
      for (const uid of [dispute.raisedBy._id, dispute.against._id]) {
        await notify(uid, '⚖️ Dispute Update', msg, dispute._id);
      }
    }

    const populated = await populateDispute(Dispute.findById(dispute._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: assign to self ──────────────────────────────────────────────── */
exports.assignDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    dispute.assignedAdmin = req.user.id;
    addActivity(dispute, 'Assigned to admin', req.user.id, 'admin', '', true);
    await dispute.save();
    const populated = await populateDispute(Dispute.findById(dispute._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: set priority ────────────────────────────────────────────────── */
exports.setPriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    dispute.priority = priority;
    addActivity(dispute, `Priority set to ${priority}`, req.user.id, 'admin', '', true);
    await dispute.save();
    const populated = await populateDispute(Dispute.findById(dispute._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: add internal note ───────────────────────────────────────────── */
exports.addAdminNote = async (req, res) => {
  try {
    const { note } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    addActivity(dispute, 'Internal note', req.user.id, 'admin', note, true);
    await dispute.save();
    const populated = await populateDispute(Dispute.findById(dispute._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: temporary suspension ───────────────────────────────────────── */
exports.suspendUser = async (req, res) => {
  try {
    const { userId, note } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    // Mark worker as unavailable (temporary suspension)
    await User.findByIdAndUpdate(userId, { 'workerProfile.availability': false });

    dispute.suspendedUser  = userId;
    dispute.suspensionNote = note;
    addActivity(dispute, 'Temporary suspension applied', req.user.id, 'admin', note, false);
    await dispute.save();

    await notify(userId, '⚠️ Account Temporarily Suspended',
      `Your account has been temporarily suspended pending dispute resolution. ${note || ''}`, dispute._id);

    const populated = await populateDispute(Dispute.findById(dispute._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── User: add evidence ─────────────────────────────────────────────────── */
exports.addEvidence = async (req, res) => {
  try {
    const { evidenceNote } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    const isRaisedBy = dispute.raisedBy.toString() === req.user.id;
    const isAgainst  = dispute.against.toString()  === req.user.id;
    if (!isRaisedBy && !isAgainst) return res.status(403).json({ message: 'Not authorized' });

    if (isRaisedBy) dispute.evidenceNote     = evidenceNote;
    else            dispute.evidenceByWorker = evidenceNote;

    addActivity(dispute, 'Evidence submitted', req.user.id, req.user.role, evidenceNote.slice(0, 120));
    if (['evidence-requested','waiting-for-customer','waiting-for-worker'].includes(dispute.status)) {
      dispute.status = 'under-review';
    }
    await dispute.save();

    // Notify admin
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const a of admins) {
      await notify(a._id, '📎 Evidence Submitted', `Evidence added to dispute: ${dispute.reason}`, dispute._id);
    }

    const populated = await populateDispute(Dispute.findById(dispute._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Mark seen ──────────────────────────────────────────────────────────── */
exports.markDisputesSeen = async (req, res) => {
  try {
    const uid = req.user.id;
    await Dispute.updateMany(
      { $or: [{ raisedBy: uid }, { against: uid }], seenBy: { $ne: uid } },
      { $addToSet: { seenBy: uid } }
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Legacy ─────────────────────────────────────────────────────────────── */
exports.resolveDispute = async (req, res) => {
  req.body.status = 'resolved-customer';
  return exports.updateDisputeStatus(req, res);
};
