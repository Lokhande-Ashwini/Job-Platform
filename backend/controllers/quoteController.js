const Quote    = require('../models/Quote');
const Booking  = require('../models/Booking');
const Notification = require('../models/Notification');

const ADMIN_FLAG_THRESHOLD = 1.8; // flag if quoted > 1.8x base rate
const DEFAULT_VALIDITY_DAYS = 3;

const notify = async (userId, title, message, relatedId) => {
  await Notification.create({ user: userId, title, message, type: 'system', relatedId }).catch(() => {});
};

const populateQuote = (q) =>
  q.populate('worker',  'name avatar workerProfile.hourlyRate workerProfile.skills workerProfile.rating workerProfile.verificationStatus')
   .populate('customer','name avatar')
   .populate('booking', 'service scheduledDate amount status')
   .populate('history.by', 'name role')
   .populate('questions.askedBy',   'name role')
   .populate('questions.answeredBy','name role');

/* ── Worker: create quote ─────────────────────────────────────────────────── */
exports.createQuote = async (req, res) => {
  try {
    const { bookingId, quotedAmount, notes, estimatedHours, estimatedStartDate, validityDays } = req.body;

    const booking = await Booking.findById(bookingId).populate('worker', 'name workerProfile');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.worker._id.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not your booking' });

    // Check no existing active quote
    const existing = await Quote.findOne({ booking: bookingId, status: { $nin: ['rejected', 'expired'] } });
    if (existing) return res.status(400).json({ message: 'An active quote already exists for this booking' });

    const baseRate = booking.worker?.workerProfile?.hourlyRate || 0;
    const amount   = Number(quotedAmount);
    const adminReviewRequired = baseRate > 0 && amount > baseRate * ADMIN_FLAG_THRESHOLD;
    const flagReason = adminReviewRequired
      ? `Quoted ₹${amount} is ${((amount / baseRate) * 100).toFixed(0)}% of base rate ₹${baseRate}`
      : undefined;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (Number(validityDays) || DEFAULT_VALIDITY_DAYS));

    const quote = await Quote.create({
      booking:   bookingId,
      customer:  booking.customer,
      worker:    req.user.id,
      baseRate,
      estimatedAmount: booking.amount,
      quotedAmount:    amount,
      notes,
      estimatedHours:     estimatedHours || undefined,
      estimatedStartDate: estimatedStartDate || undefined,
      validUntil,
      status:              adminReviewRequired ? 'admin-review' : 'new',
      adminReviewRequired,
      flagReason,
      seenBy:  [req.user.id],
      history: [{ action: 'submitted', by: req.user.id, byRole: 'worker', amount, note: notes }],
    });

    // Notify customer
    await notify(
      booking.customer,
      '💬 New Quote Received',
      `${booking.worker.name} sent a quote of ₹${amount} for "${booking.service}". Valid for ${validityDays || DEFAULT_VALIDITY_DAYS} days.`,
      quote._id
    );

    const populated = await populateQuote(Quote.findById(quote._id));
    res.status(201).json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Customer: get incoming quotes ───────────────────────────────────────── */
exports.getIncomingQuotes = async (req, res) => {
  try {
    const quotes = await populateQuote(
      Quote.find({ customer: req.user.id }).sort('-updatedAt')
    );
    res.json(quotes);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Worker: get sent quotes ─────────────────────────────────────────────── */
exports.getMyQuotes = async (req, res) => {
  try {
    const quotes = await populateQuote(
      Quote.find({ worker: req.user.id }).sort('-updatedAt')
    );
    res.json(quotes);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Anyone: get quote by booking ────────────────────────────────────────── */
exports.getQuotesByBooking = async (req, res) => {
  try {
    const quote = await populateQuote(
      Quote.findOne({ booking: req.params.bookingId })
    );
    res.json(quote);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Customer: mark quote as viewed ─────────────────────────────────────── */
exports.markViewed = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    if (!quote.viewedByCustomer && quote.customer.toString() === req.user.id) {
      quote.viewedByCustomer = true;
      quote.viewedAt = new Date();
      if (quote.status === 'new') quote.status = 'viewed';
      const uid = req.user.id.toString();
      if (!quote.seenBy.map(s => s.toString()).includes(uid)) quote.seenBy.push(req.user.id);
      await quote.save();
      // Notify worker their quote was viewed
      await notify(quote.worker, '👁️ Quote Viewed', 'Customer has viewed your quote.', quote._id);
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Mark seen (generic) ─────────────────────────────────────────────────── */
exports.markQuoteSeen = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    const uid = req.user.id.toString();
    if (!quote.seenBy.map(s => s.toString()).includes(uid)) {
      quote.seenBy.push(req.user.id);
      await quote.save();
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Customer: counter offer ─────────────────────────────────────────────── */
exports.counterQuote = async (req, res) => {
  try {
    const { counterAmount, note } = req.body;
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    if (quote.customer.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (!['new','viewed','negotiating'].includes(quote.status))
      return res.status(400).json({ message: 'Cannot counter at this stage' });

    quote.counterAmount = Number(counterAmount);
    quote.status = 'negotiating';
    quote.seenBy = [req.user.id];
    quote.history.push({ action: 'counter-offer', by: req.user.id, byRole: 'customer', amount: Number(counterAmount), note });
    await quote.save();

    await notify(quote.worker, '🔄 Counter Offer Received',
      `Customer countered your quote with ₹${counterAmount}.`, quote._id);

    const populated = await populateQuote(Quote.findById(quote._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Worker: counter back ────────────────────────────────────────────────── */
exports.workerCounter = async (req, res) => {
  try {
    const { counterAmount, note } = req.body;
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    if (quote.worker.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (quote.status !== 'negotiating') return res.status(400).json({ message: 'No counter to respond to' });

    quote.quotedAmount = Number(counterAmount);
    quote.counterAmount = undefined;
    quote.status = 'negotiating';
    quote.seenBy = [req.user.id];
    quote.history.push({ action: 'worker-counter', by: req.user.id, byRole: 'worker', amount: Number(counterAmount), note });
    await quote.save();

    await notify(quote.customer, '🔄 Worker Updated Quote',
      `Worker revised their quote to ₹${counterAmount}.`, quote._id);

    const populated = await populateQuote(Quote.findById(quote._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Accept quote (customer or worker accepting counter) ─────────────────── */
exports.approveQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const isCustomer = quote.customer.toString() === req.user.id;
    const isWorker   = quote.worker.toString()   === req.user.id;
    if (!isCustomer && !isWorker) return res.status(403).json({ message: 'Not authorized' });

    const finalAmount = quote.counterAmount || quote.quotedAmount;
    quote.status      = 'accepted';
    quote.finalAmount = finalAmount;
    quote.seenBy      = [req.user.id];
    quote.history.push({ action: 'accepted', by: req.user.id, byRole: isCustomer ? 'customer' : 'worker', amount: finalAmount });
    await quote.save();

    // Update booking amount to agreed price
    await Booking.findByIdAndUpdate(quote.booking, { amount: finalAmount });

    const notifyTarget = isCustomer ? quote.worker : quote.customer;
    await notify(notifyTarget, '✅ Quote Accepted',
      `Quote of ₹${finalAmount} has been accepted.`, quote._id);

    const populated = await populateQuote(Quote.findById(quote._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Reject quote ────────────────────────────────────────────────────────── */
exports.rejectQuote = async (req, res) => {
  try {
    const { note } = req.body;
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const isCustomer = quote.customer.toString() === req.user.id;
    const isWorker   = quote.worker.toString()   === req.user.id;
    if (!isCustomer && !isWorker) return res.status(403).json({ message: 'Not authorized' });

    quote.status = 'rejected';
    quote.seenBy = [req.user.id];
    quote.history.push({ action: 'rejected', by: req.user.id, byRole: isCustomer ? 'customer' : 'worker', note });
    await quote.save();

    const notifyTarget = isCustomer ? quote.worker : quote.customer;
    await notify(notifyTarget, '❌ Quote Rejected',
      `A quote has been rejected.`, quote._id);

    const populated = await populateQuote(Quote.findById(quote._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Ask a question on a quote ───────────────────────────────────────────── */
exports.askQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const isParticipant = [quote.customer.toString(), quote.worker.toString()].includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    quote.questions.push({ askedBy: req.user.id, question });
    if (!['accepted','rejected','expired'].includes(quote.status)) quote.status = 'negotiating';
    await quote.save();

    const notifyTarget = quote.customer.toString() === req.user.id ? quote.worker : quote.customer;
    await notify(notifyTarget, '❓ Question on Quote',
      `Someone asked a question about your quote: "${question.slice(0, 60)}"`, quote._id);

    const populated = await populateQuote(Quote.findById(quote._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Answer a question ───────────────────────────────────────────────────── */
exports.answerQuestion = async (req, res) => {
  try {
    const { answer } = req.body;
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const qItem = quote.questions.id(req.params.questionId);
    if (!qItem) return res.status(404).json({ message: 'Question not found' });

    qItem.answer     = answer;
    qItem.answeredBy = req.user.id;
    qItem.answeredAt = new Date();
    await quote.save();

    await notify(qItem.askedBy, '💬 Question Answered',
      `Your question on the quote has been answered.`, quote._id);

    const populated = await populateQuote(Quote.findById(quote._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: get all quotes needing review ────────────────────────────────── */
exports.getAdminReviewQuotes = async (req, res) => {
  try {
    const quotes = await populateQuote(
      Quote.find({ adminReviewRequired: true }).sort('-createdAt')
    );
    res.json(quotes);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: decide on flagged quote ─────────────────────────────────────── */
exports.adminDecideQuote = async (req, res) => {
  try {
    const { decision, note } = req.body;
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    quote.adminDecision = decision;
    quote.adminNote     = note;
    quote.status        = decision === 'approved' ? 'new' : 'rejected';
    quote.seenBy        = [];
    quote.history.push({ action: `admin-${decision}`, by: req.user.id, byRole: 'admin', note });
    await quote.save();

    await notify(quote.worker, `Admin ${decision === 'approved' ? 'Approved' : 'Rejected'} Your Quote`,
      note || `Admin has ${decision} your quote.`, quote._id);
    await notify(quote.customer, `Quote ${decision === 'approved' ? 'Approved by Admin' : 'Rejected'}`,
      note || `Admin has ${decision} the quote for your booking.`, quote._id);

    const populated = await populateQuote(Quote.findById(quote._id));
    res.json(await populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Expire stale quotes (can be called by cron or admin) ────────────────── */
exports.expireQuotes = async (req, res) => {
  try {
    const result = await Quote.updateMany(
      { validUntil: { $lt: new Date() }, status: { $in: ['new', 'viewed', 'negotiating'] } },
      { $set: { status: 'expired' } }
    );
    res.json({ expired: result.modifiedCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
