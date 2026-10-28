const PaymentTransaction = require('../models/PaymentTransaction');
const WorkerPayout       = require('../models/WorkerPayout');
const PlatformSettings   = require('../models/PlatformSettings');
const Booking            = require('../models/Booking');
const User               = require('../models/User');
const mongoose           = require('mongoose');

/* ── Default platform settings ──────────────────────────────────────────── */
const DEFAULTS = {
  platformFeeType:    'percentage',
  platformFeeValue:   5,
  supportFee:         20,
  urgentFeeMultiplier:1.5,
  urgentFeeFixed:     100,
  commissionRate:     10,
  taxRate:            18,
  taxOnWorker:        false,
  workerTaxRate:      2,
  payoutMode:         'manual',
  payoutCycleDays:    7,
  cashAllowed:        true,
  advanceRequired:    false,
};

const getSettings = async () => {
  try {
    const rows = await PlatformSettings.find({});
    const s = { ...DEFAULTS };
    rows.forEach(r => { s[r.key] = r.value; });
    return s;
  } catch { return { ...DEFAULTS }; }
};

const calcBreakdown = (serviceAmount, isEmergency, settings) => {
  const s = settings || DEFAULTS;
  const platformFee = s.platformFeeType === 'percentage'
    ? Math.round(serviceAmount * s.platformFeeValue / 100)
    : s.platformFeeValue;
  const supportFee  = s.supportFee;
  const urgentFee   = isEmergency ? s.urgentFeeFixed : 0;
  const taxableAmount = platformFee + supportFee + urgentFee;
  const taxAmount   = Math.round(taxableAmount * s.taxRate / 100);
  const totalPaid   = serviceAmount + platformFee + supportFee + urgentFee + taxAmount;
  const commissionDeduction = Math.round(serviceAmount * s.commissionRate / 100);
  const workerTaxDeduction  = s.taxOnWorker ? Math.round(serviceAmount * s.workerTaxRate / 100) : 0;
  const netPayout   = serviceAmount - commissionDeduction - workerTaxDeduction;
  const platformRevenue = platformFee + supportFee + urgentFee + commissionDeduction + taxAmount;
  return {
    serviceAmount, platformFee, supportFee, urgentFee, taxAmount, taxableAmount,
    discountAmount: 0, totalPaid, commissionDeduction, workerTaxDeduction, netPayout, platformRevenue,
    rates: {
      platformFeeRate: s.platformFeeType === 'percentage' ? s.platformFeeValue : 0,
      commissionRate:  s.commissionRate,
      taxRate:         s.taxRate,
      workerTaxRate:   s.taxOnWorker ? s.workerTaxRate : 0,
    },
  };
};

exports.calcBreakdown = calcBreakdown;
exports.getSettings   = getSettings;

/* ── Breakdown preview ───────────────────────────────────────────────────── */
exports.getBreakdownPreview = async (req, res) => {
  try {
    const booking  = await Booking.findById(req.params.bookingId).populate('worker', 'name workerProfile');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const settings = await getSettings();
    const bd = calcBreakdown(booking.amount, booking.isEmergency, settings);
    res.json({ booking: { _id: booking._id, service: booking.service, worker: booking.worker }, breakdown: bd, settings });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Create financial records after payment ─────────────────────────────── */
exports.createFinancialRecords = async (bookingId, paymentRef, paymentMethod) => {
  try {
    const booking  = await Booking.findById(bookingId);
    if (!booking) return;
    const settings = await getSettings();
    const bd = calcBreakdown(booking.amount, booking.isEmergency, settings);
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${booking._id.toString().slice(-4).toUpperCase()}`;
    const txn = await PaymentTransaction.findOneAndUpdate(
      { booking: bookingId },
      {
        booking: bookingId, customer: booking.customer, worker: booking.worker,
        serviceAmount: bd.serviceAmount, platformFee: bd.platformFee, supportFee: bd.supportFee,
        urgentFee: bd.urgentFee, taxAmount: bd.taxAmount, discountAmount: bd.discountAmount,
        totalPaid: bd.totalPaid, platformFeeRate: bd.rates.platformFeeRate,
        taxRate: bd.rates.taxRate, commissionRate: bd.rates.commissionRate,
        paymentMethod: paymentMethod || booking.paymentMethod, paymentStatus: 'paid',
        transactionRef: paymentRef || booking.paymentId, invoiceNumber, paidAt: new Date(),
      },
      { upsert: true, new: true }
    );
    const payoutDate = new Date();
    if (settings.payoutMode === 'weekly') payoutDate.setDate(payoutDate.getDate() + 7);
    if (settings.payoutMode === 'daily')  payoutDate.setDate(payoutDate.getDate() + 1);
    const payoutStatus = settings.payoutMode === 'instant' ? 'credited' : 'pending';
    await WorkerPayout.findOneAndUpdate(
      { booking: bookingId },
      {
        booking: bookingId, worker: booking.worker, transaction: txn._id,
        grossAmount: bd.serviceAmount, commissionDeduction: bd.commissionDeduction,
        taxDeduction: bd.workerTaxDeduction, penaltyDeduction: 0, netPayout: bd.netPayout,
        commissionRate: bd.rates.commissionRate, taxRate: bd.rates.workerTaxRate,
        payoutStatus, payoutDate: settings.payoutMode === 'instant' ? new Date() : payoutDate,
        payoutReference: `PAY-${Date.now().toString(36).toUpperCase()}`,
      },
      { upsert: true, new: true }
    );
    return { txn, bd };
  } catch (err) { console.error('createFinancialRecords error:', err.message); }
};

/* ── Worker: earnings overview ───────────────────────────────────────────── */
exports.getWorkerEarnings = async (req, res) => {
  try {
    const workerId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [payouts, monthPayouts, todayPayouts] = await Promise.all([
      WorkerPayout.find({ worker: workerId })
        .populate({ path: 'booking', populate: { path: 'customer', select: 'name' }, select: 'service scheduledDate customer amount isEmergency paymentMethod' })
        .populate('transaction')
        .sort('-createdAt'),
      WorkerPayout.find({ worker: workerId, createdAt: { $gte: startOfMonth } }),
      WorkerPayout.find({ worker: workerId, createdAt: { $gte: startOfDay } }),
    ]);

    const totalEarned     = payouts.reduce((s, p) => s + p.netPayout, 0);
    const totalGross      = payouts.reduce((s, p) => s + p.grossAmount, 0);
    const totalCommission = payouts.reduce((s, p) => s + p.commissionDeduction, 0);
    const totalTax        = payouts.reduce((s, p) => s + p.taxDeduction, 0);
    const totalPenalty    = payouts.reduce((s, p) => s + p.penaltyDeduction, 0);
    const credited        = payouts.filter(p => p.payoutStatus === 'credited').reduce((s, p) => s + p.netPayout, 0);
    const pending         = payouts.filter(p => ['pending','processing'].includes(p.payoutStatus)).reduce((s, p) => s + p.netPayout, 0);
    const thisMonth       = monthPayouts.reduce((s, p) => s + p.netPayout, 0);
    const today           = todayPayouts.reduce((s, p) => s + p.netPayout, 0);

    // Monthly breakdown for charts
    const monthlyMap = {};
    payouts.forEach(p => {
      const d = p.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, gross: 0, net: 0, commission: 0, count: 0 };
      monthlyMap[key].gross      += p.grossAmount;
      monthlyMap[key].net        += p.netPayout;
      monthlyMap[key].commission += p.commissionDeduction;
      monthlyMap[key].count      += 1;
    });
    const monthlyChart = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

    res.json({
      summary: { totalEarned, totalGross, totalCommission, totalTax, totalPenalty, credited, pending, thisMonth, today, available: credited },
      payouts,
      monthlyChart,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Worker: single payout detail ───────────────────────────────────────── */
exports.getPayoutDetail = async (req, res) => {
  try {
    const payout = await WorkerPayout.findById(req.params.id)
      .populate({ path: 'booking', populate: { path: 'customer', select: 'name' }, select: 'service scheduledDate customer worker amount isEmergency paymentMethod' })
      .populate('transaction');
    if (!payout) return res.status(404).json({ message: 'Payout not found' });
    if (payout.worker.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    res.json(payout);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Customer: transaction detail ───────────────────────────────────────── */
exports.getTransactionDetail = async (req, res) => {
  try {
    const txn = await PaymentTransaction.findOne({ booking: req.params.bookingId })
      .populate('booking',  'service scheduledDate status timeline isEmergency')
      .populate('customer', 'name email phone')
      .populate('worker',   'name phone');
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    if (txn.customer._id.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    res.json(txn);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Customer: all transactions ─────────────────────────────────────────── */
exports.getCustomerTransactions = async (req, res) => {
  try {
    const txns = await PaymentTransaction.find({ customer: req.user.id })
      .populate('booking', 'service scheduledDate status isEmergency')
      .populate('worker',  'name')
      .sort('-createdAt');

    // Summary stats
    const totalPaid      = txns.filter(t => t.paymentStatus === 'paid').reduce((s, t) => s + t.totalPaid, 0);
    const totalPending   = txns.filter(t => t.paymentStatus === 'pending').reduce((s, t) => s + t.totalPaid, 0);
    const totalTax       = txns.filter(t => t.paymentStatus === 'paid').reduce((s, t) => s + t.taxAmount, 0);
    const totalPlatformFee = txns.filter(t => t.paymentStatus === 'paid').reduce((s, t) => s + t.platformFee, 0);
    const totalSupportFee  = txns.filter(t => t.paymentStatus === 'paid').reduce((s, t) => s + t.supportFee, 0);
    const totalUrgentFee   = txns.filter(t => t.paymentStatus === 'paid').reduce((s, t) => s + t.urgentFee, 0);
    const totalServiceAmt  = txns.filter(t => t.paymentStatus === 'paid').reduce((s, t) => s + t.serviceAmount, 0);

    // Monthly spend chart
    const monthlyMap = {};
    txns.filter(t => t.paymentStatus === 'paid').forEach(t => {
      const d = t.paidAt || t.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, spent: 0, count: 0 };
      monthlyMap[key].spent += t.totalPaid;
      monthlyMap[key].count += 1;
    });
    const monthlyChart = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

    res.json({
      transactions: txns,
      summary: { totalPaid, totalPending, totalTax, totalPlatformFee, totalSupportFee, totalUrgentFee, totalServiceAmt, txnCount: txns.length },
      monthlyChart,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: full revenue dashboard ──────────────────────────────────────── */
exports.getAdminRevenue = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);
    const txnFilter = Object.keys(dateFilter).length ? { paidAt: dateFilter } : {};

    const [txns, payouts, settings] = await Promise.all([
      PaymentTransaction.find({ paymentStatus: 'paid', ...txnFilter })
        .populate('booking',  'service isEmergency status hasDispute')
        .populate('customer', 'name')
        .populate('worker',   'name')
        .sort('-paidAt'),
      WorkerPayout.find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
        .populate('worker', 'name'),
      getSettings(),
    ]);

    const totalBookingValue  = txns.reduce((s, t) => s + t.serviceAmount, 0);
    const totalCustomerPaid  = txns.reduce((s, t) => s + t.totalPaid, 0);
    const totalPlatformFee   = txns.reduce((s, t) => s + t.platformFee, 0);
    const totalSupportFee    = txns.reduce((s, t) => s + t.supportFee, 0);
    const totalUrgentFee     = txns.reduce((s, t) => s + t.urgentFee, 0);
    const totalTaxCollected  = txns.reduce((s, t) => s + t.taxAmount, 0);
    const totalCommission    = payouts.reduce((s, p) => s + p.commissionDeduction, 0);
    const totalWorkerPayouts = payouts.reduce((s, p) => s + p.netPayout, 0);
    const netProfit = totalPlatformFee + totalSupportFee + totalUrgentFee + totalCommission;

    const monthlyMap = {};
    txns.forEach(t => {
      const d = t.paidAt || t.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, commission: 0, tax: 0, payouts: 0, profit: 0, txnCount: 0 };
      monthlyMap[key].revenue   += t.platformFee + t.supportFee + t.urgentFee;
      monthlyMap[key].tax       += t.taxAmount;
      monthlyMap[key].txnCount  += 1;
    });
    payouts.forEach(p => {
      const d = p.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, commission: 0, tax: 0, payouts: 0, profit: 0, txnCount: 0 };
      monthlyMap[key].commission += p.commissionDeduction;
      monthlyMap[key].payouts    += p.netPayout;
    });
    Object.values(monthlyMap).forEach(m => { m.profit = m.revenue + m.commission; });
    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      summary: { totalBookingValue, totalCustomerPaid, totalPlatformFee, totalSupportFee, totalUrgentFee, totalTaxCollected, totalCommission, totalWorkerPayouts, netProfit, txnCount: txns.length },
      transactions: txns, payouts, monthly, settings,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: update payout status ────────────────────────────────────────── */
exports.updatePayoutStatus = async (req, res) => {
  try {
    const { status, payoutReference } = req.body;
    const update = { payoutStatus: status };
    if (status === 'credited') update.payoutDate = new Date();
    if (payoutReference) update.payoutReference = payoutReference;
    const payout = await WorkerPayout.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('worker', 'name').populate('booking', 'service');
    if (!payout) return res.status(404).json({ message: 'Payout not found' });
    res.json(payout);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: platform settings ───────────────────────────────────────────── */
exports.getPlatformSettings = async (req, res) => {
  try { res.json(await getSettings()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updatePlatformSettings = async (req, res) => {
  try {
    await Promise.all(Object.entries(req.body).map(([key, value]) =>
      PlatformSettings.findOneAndUpdate({ key }, { key, value, updatedAt: new Date() }, { upsert: true })
    ));
    res.json(await getSettings());
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: all worker payouts ───────────────────────────────────────────── */
exports.getAllPayouts = async (req, res) => {
  try {
    const { status, worker, from, to } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.payoutStatus = status;
    if (worker) filter.worker = worker;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    const payouts = await WorkerPayout.find(filter)
      .populate('worker',  'name phone')
      .populate('booking', 'service scheduledDate')
      .populate('transaction', 'paymentMethod totalPaid')
      .sort('-createdAt');

    const summary = {
      total:      payouts.length,
      pending:    payouts.filter(p => p.payoutStatus === 'pending').length,
      processing: payouts.filter(p => p.payoutStatus === 'processing').length,
      credited:   payouts.filter(p => p.payoutStatus === 'credited').length,
      failed:     payouts.filter(p => p.payoutStatus === 'failed').length,
      onHold:     payouts.filter(p => p.payoutStatus === 'on-hold').length,
      totalAmount:     payouts.reduce((s, p) => s + p.netPayout, 0),
      pendingAmount:   payouts.filter(p => p.payoutStatus === 'pending').reduce((s, p) => s + p.netPayout, 0),
      totalCommission: payouts.reduce((s, p) => s + p.commissionDeduction, 0),
    };
    res.json({ payouts, summary });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: profit analytics ─────────────────────────────────────────────── */
exports.getAdminProfitAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);
    const txnFilter = Object.keys(dateFilter).length ? { paidAt: dateFilter } : {};

    const [txns, payouts, refundedTxns, allUsers] = await Promise.all([
      PaymentTransaction.find({ paymentStatus: 'paid', ...txnFilter })
        .populate('booking', 'service isEmergency status')
        .populate('customer', 'name')
        .populate('worker',   'name')
        .sort('-paidAt'),
      WorkerPayout.find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
        .populate('worker', 'name'),
      PaymentTransaction.find({ paymentStatus: 'refunded', ...txnFilter }),
      User.countDocuments({ role: { $in: ['customer','worker'] } }),
    ]);

    // Service-wise breakdown
    const serviceMap = {};
    txns.forEach(t => {
      const svc = t.booking?.service || 'Other';
      if (!serviceMap[svc]) serviceMap[svc] = { service: svc, revenue: 0, commission: 0, txnCount: 0, totalPaid: 0 };
      serviceMap[svc].revenue   += t.platformFee + t.supportFee + t.urgentFee;
      serviceMap[svc].totalPaid += t.totalPaid;
      serviceMap[svc].txnCount  += 1;
    });
    const serviceBreakdown = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

    // Payment method breakdown
    const methodMap = {};
    txns.forEach(t => {
      const m = t.paymentMethod || 'cash';
      if (!methodMap[m]) methodMap[m] = { method: m, count: 0, total: 0 };
      methodMap[m].count++;
      methodMap[m].total += t.totalPaid;
    });

    // Refund stats
    const totalRefundLoss = refundedTxns.reduce((s, t) => s + t.totalPaid, 0);

    // Top workers by payout volume
    const workerMap = {};
    payouts.forEach(p => {
      const wid = p.worker?._id?.toString() || p.worker?.toString();
      if (!wid) return;
      if (!workerMap[wid]) workerMap[wid] = { name: p.worker?.name || 'Worker', gross: 0, net: 0, commission: 0, count: 0 };
      workerMap[wid].gross      += p.grossAmount;
      workerMap[wid].net        += p.netPayout;
      workerMap[wid].commission += p.commissionDeduction;
      workerMap[wid].count      += 1;
    });
    const topWorkers = Object.values(workerMap).sort((a, b) => b.gross - a.gross).slice(0, 10);

    // Monthly detailed breakdown
    const monthlyMap = {};
    txns.forEach(t => {
      const d = t.paidAt || t.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, feeRevenue: 0, commission: 0, tax: 0, payouts: 0, profit: 0, txnCount: 0, totalPaid: 0, refundLoss: 0 };
      monthlyMap[key].feeRevenue += t.platformFee + t.supportFee + t.urgentFee;
      monthlyMap[key].tax        += t.taxAmount;
      monthlyMap[key].totalPaid  += t.totalPaid;
      monthlyMap[key].txnCount   += 1;
    });
    payouts.forEach(p => {
      const d = p.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, feeRevenue: 0, commission: 0, tax: 0, payouts: 0, profit: 0, txnCount: 0, totalPaid: 0, refundLoss: 0 };
      monthlyMap[key].commission += p.commissionDeduction;
      monthlyMap[key].payouts    += p.netPayout;
    });
    refundedTxns.forEach(t => {
      const d = t.paidAt || t.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (monthlyMap[key]) monthlyMap[key].refundLoss += t.totalPaid;
    });
    Object.values(monthlyMap).forEach(m => { m.profit = m.feeRevenue + m.commission - m.refundLoss; });
    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    const payoutStatusMap = {};
    payouts.forEach(p => { payoutStatusMap[p.payoutStatus] = (payoutStatusMap[p.payoutStatus] || 0) + 1; });

    const totalPlatformFee  = txns.reduce((s, t) => s + t.platformFee, 0);
    const totalSupportFee   = txns.reduce((s, t) => s + t.supportFee, 0);
    const totalUrgentFee    = txns.reduce((s, t) => s + t.urgentFee, 0);
    const totalTax          = txns.reduce((s, t) => s + t.taxAmount, 0);
    const totalCommission   = payouts.reduce((s, p) => s + p.commissionDeduction, 0);
    const totalWorkerPayouts= payouts.reduce((s, p) => s + p.netPayout, 0);
    const grossRevenue      = totalPlatformFee + totalSupportFee + totalUrgentFee + totalCommission;
    const netProfit         = grossRevenue - totalRefundLoss;

    // Pending/failed payment counts
    const [pendingTxns, failedTxns, pendingPayoutCount] = await Promise.all([
      PaymentTransaction.countDocuments({ paymentStatus: 'pending' }),
      PaymentTransaction.countDocuments({ paymentStatus: 'failed' }),
      WorkerPayout.countDocuments({ payoutStatus: 'pending' }),
    ]);

    res.json({
      summary: {
        totalPlatformFee, totalSupportFee, totalUrgentFee, totalTax,
        totalCommission, totalWorkerPayouts, grossRevenue, netProfit,
        totalRefundLoss, txnCount: txns.length,
        totalCustomerPaid: txns.reduce((s, t) => s + t.totalPaid, 0),
        totalBookingValue: txns.reduce((s, t) => s + t.serviceAmount, 0),
        pendingPayouts: pendingPayoutCount,
        pendingPayoutAmount: payouts.filter(p => p.payoutStatus === 'pending').reduce((s, p) => s + p.netPayout, 0),
        pendingTxns, failedTxns,
      },
      monthly, serviceBreakdown,
      paymentMethods: Object.values(methodMap),
      topWorkers, payoutStatusSummary: payoutStatusMap,
      transactions: txns, payouts,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: tax summary ──────────────────────────────────────────────────── */
exports.getAdminTaxSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);
    const txnFilter = Object.keys(dateFilter).length ? { paidAt: dateFilter } : {};

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allTxns, monthTxns, refundedTxns] = await Promise.all([
      PaymentTransaction.find({ paymentStatus: 'paid', ...txnFilter })
        .populate('booking', 'service scheduledDate isEmergency')
        .populate('customer', 'name')
        .populate('worker', 'name')
        .sort('-paidAt'),
      PaymentTransaction.find({ paymentStatus: 'paid', paidAt: { $gte: startOfMonth } }),
      PaymentTransaction.find({ paymentStatus: 'refunded', ...txnFilter }),
    ]);

    const totalTaxCollected  = allTxns.reduce((s, t) => s + t.taxAmount, 0);
    const monthTaxCollected  = monthTxns.reduce((s, t) => s + t.taxAmount, 0);
    const refundedTax        = refundedTxns.reduce((s, t) => s + t.taxAmount, 0);
    const netTaxAmount       = totalTaxCollected - refundedTax;
    const totalCustomerPaid  = allTxns.reduce((s, t) => s + t.totalPaid, 0);
    const totalPlatformEarnings = allTxns.reduce((s, t) => s + t.platformFee + t.supportFee + t.urgentFee, 0);

    res.json({
      summary: { totalTaxCollected, monthTaxCollected, refundedTax, netTaxAmount, totalCustomerPaid, totalPlatformEarnings, txnCount: allTxns.length },
      transactions: allTxns,
      refundedTransactions: refundedTxns,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin: CSV export ───────────────────────────────────────────────────── */
exports.exportCSV = async (req, res) => {
  try {
    const { type = 'transactions', from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);

    if (type === 'transactions') {
      const txns = await PaymentTransaction.find(Object.keys(dateFilter).length ? { paidAt: dateFilter } : {})
        .populate('booking', 'service').populate('customer', 'name').populate('worker', 'name').sort('-paidAt');
      const header = 'Invoice,Service,Customer,Worker,Service Amount,Platform Fee,Support Fee,Urgent Fee,Tax,Total Paid,Method,Status,Date\n';
      const rows = txns.map(t =>
        `${t.invoiceNumber||''},${t.booking?.service||''},${t.customer?.name||''},${t.worker?.name||''},${t.serviceAmount},${t.platformFee},${t.supportFee},${t.urgentFee},${t.taxAmount},${t.totalPaid},${t.paymentMethod},${t.paymentStatus},${t.paidAt?.toISOString().split('T')[0]||''}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
      return res.send(header + rows);
    }

    if (type === 'payouts') {
      const payouts = await WorkerPayout.find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
        .populate('worker', 'name').populate('booking', 'service').sort('-createdAt');
      const header = 'Reference,Worker,Service,Gross,Commission,Tax,Penalty,Net Payout,Status,Payout Date\n';
      const rows = payouts.map(p =>
        `${p.payoutReference||''},${p.worker?.name||''},${p.booking?.service||''},${p.grossAmount},${p.commissionDeduction},${p.taxDeduction},${p.penaltyDeduction},${p.netPayout},${p.payoutStatus},${p.payoutDate?.toISOString().split('T')[0]||''}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=payouts-${Date.now()}.csv`);
      return res.send(header + rows);
    }

    if (type === 'tax') {
      const txns = await PaymentTransaction.find({ paymentStatus: 'paid', ...(Object.keys(dateFilter).length ? { paidAt: dateFilter } : {}) })
        .populate('booking', 'service').populate('customer', 'name').sort('-paidAt');
      const header = 'Invoice,Service,Customer,Service Amount,Tax Rate,Tax Amount,Total Paid,Date\n';
      const rows = txns.map(t =>
        `${t.invoiceNumber||''},${t.booking?.service||''},${t.customer?.name||''},${t.serviceAmount},${t.taxRate}%,${t.taxAmount},${t.totalPaid},${t.paidAt?.toISOString().split('T')[0]||''}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=tax-report-${Date.now()}.csv`);
      return res.send(header + rows);
    }

    res.status(400).json({ message: 'Invalid export type' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
