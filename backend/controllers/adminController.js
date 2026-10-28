const User = require('../models/User');
const Booking = require('../models/Booking');

// Check if admin exists (public — used for first-time setup)
exports.checkAdminExists = async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    res.json({ exists: !!admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create first admin (only allowed if no admin exists)
exports.createFirstAdmin = async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.status(403).json({ message: 'Admin account already exists. Only one admin is allowed.' });
    }
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const admin = await User.create({
      name, email, password, phone, role: 'admin',
      location: { type: 'Point', coordinates: [0, 0], address: 'India' }
    });
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    res.status(201).json({ token, user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const { trustFilter } = req.query; // 'high' | 'low' | 'all'
    const customers = await User.find({ role: 'customer' }).select('-password').sort('-createdAt');
    const { getCustomerCompletion } = require('../utils/profileCompletion');
    const { calculateCustomerTrustScore } = require('../utils/trustScore');
    const Booking = require('../models/Booking');

    const result = await Promise.all(customers.map(async c => {
      const obj = c.toObject();
      obj.profileCompletion = getCustomerCompletion(c);
      const bookings = await Booking.find({ customer: c._id }).lean();
      obj.trustScore = calculateCustomerTrustScore(c, bookings);
      return obj;
    }));

    // Apply trust filter
    if (trustFilter === 'high') return res.json(result.filter(c => c.trustScore.score >= 70));
    if (trustFilter === 'low')  return res.json(result.filter(c => c.trustScore.score < 40));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all workers pending verification (includes 'submitted' status)
exports.getPendingWorkers = async (req, res) => {
  try {
    const workers = await User.find({
      role: 'worker',
      'workerProfile.verificationStatus': { $in: ['pending', 'submitted'] }
    }).select('-password');
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify or reject worker
exports.updateWorkerVerification = async (req, res) => {
  try {
    const { status, reason } = req.body; // 'verified' or 'rejected'
    
    const worker = await User.findOne({ _id: req.params.id, role: 'worker' });
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    worker.workerProfile.verificationStatus = status;
    if (status === 'verified') {
      worker.workerProfile.verificationApprovedAt = new Date();
    } else if (status === 'rejected') {
      worker.workerProfile.verificationRejectedAt = new Date();
      worker.workerProfile.verificationRejectedReason = reason || 'Documents not acceptable';
    }

    if (!worker.workerProfile.verificationHistory) worker.workerProfile.verificationHistory = [];
    worker.workerProfile.verificationHistory.push({ status, note: reason || '', at: new Date() });

    await worker.save();

    // Notify worker
    const Notification = require('../models/Notification');
    const msgs = {
      verified: { title: '✅ Verification Approved!', message: 'Your identity has been verified. You now have a Verified badge.' },
      rejected: { title: '❌ Verification Rejected', message: `Your verification was rejected. Reason: ${reason || 'Documents not acceptable'}. Please re-submit.` },
    };
    if (msgs[status]) {
      await Notification.create({ user: worker._id, title: msgs[status].title, message: msgs[status].message, type: 'verification', relatedId: worker._id }).catch(() => {});
    }

    const updated = worker.toObject(); delete updated.password;
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get platform statistics
exports.getPlatformStats = async (req, res) => {
  try {
    const Dispute      = require('../models/Dispute');
    const SupportTicket= require('../models/SupportTicket');
    const PaymentTransaction = require('../models/PaymentTransaction');

    const [
      totalUsers, totalWorkers, totalCustomers, verifiedWorkers,
      totalBookings, completedBookings, pendingBookings,
      totalRevenue, serviceDemand, topWorkers,
      openDisputes, openTickets, pendingPayouts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'worker' }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'worker', 'workerProfile.verificationStatus': 'verified' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: { $in: ['requested','accepted','scheduled','on-the-way','arrived','in-progress','waiting-for-payment'] } }),
      Booking.aggregate([
        { $match: { status: 'completed', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Booking.aggregate([
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      User.find({ role: 'worker' })
        .sort('-workerProfile.totalJobs')
        .limit(10)
        .select('name workerProfile.totalJobs workerProfile.rating workerProfile.skills'),
      Dispute.countDocuments({ status: { $in: ['open','under-review','evidence-requested','mediation-in-progress'] } }),
      SupportTicket.countDocuments({ status: { $in: ['open','in-progress','escalated'] } }),
      PaymentTransaction.countDocuments({ paymentStatus: 'pending' }),
    ]);

    res.json({
      users: { total: totalUsers, workers: totalWorkers, customers: totalCustomers, verifiedWorkers },
      bookings: { total: totalBookings, completed: completedBookings, pending: pendingBookings },
      revenue: totalRevenue[0]?.total || 0,
      disputes: { open: openDisputes },
      tickets: { open: openTickets },
      pendingPayouts,
      serviceDemand,
      topWorkers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get admin user info (for workers/customers to initiate chat)
exports.getAdminUser = async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('_id name email avatar');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Direct worker profile edit is disabled — admin must use change request workflow
exports.updateWorker = async (req, res) => {
  return res.status(403).json({ message: 'Direct worker profile edits are disabled. Use the Change Request workflow instead.' });
};

// Get all workers (for admin management)
exports.getAllWorkers = async (req, res) => {
  try {
    const { trustFilter } = req.query; // 'high' | 'low' | 'all'
    const workers = await User.find({ role: 'worker' }).select('-password').sort('-createdAt');
    const { getWorkerCompletion } = require('../utils/profileCompletion');
    const { calculateWorkerTrustScore } = require('../utils/trustScore');
    const Booking = require('../models/Booking');

    const result = await Promise.all(workers.map(async w => {
      const obj = w.toObject();
      obj.profileCompletion = getWorkerCompletion(w);
      const bookings = await Booking.find({ worker: w._id }).lean();
      obj.trustScore = calculateWorkerTrustScore(w, bookings);
      return obj;
    }));

    // Apply trust filter
    if (trustFilter === 'high') return res.json(result.filter(w => w.trustScore.score >= 70));
    if (trustFilter === 'low')  return res.json(result.filter(w => w.trustScore.score < 40));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings (admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email phone')
      .populate('worker', 'name email phone workerProfile.skills')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export workers or customers data in CSV / JSON / Excel (XLSX via simple XML)
exports.exportUsersData = async (req, res) => {
  try {
    const { type = 'workers', format = 'csv' } = req.query;
    const role = type === 'customers' ? 'customer' : 'worker';
    const users = await User.find({ role }).select('-password').sort('-createdAt').lean();

    const filename = `${type}_${new Date().toISOString().slice(0,10)}`;

    // ── Build flat rows ──────────────────────────────────────────────
    const rows = users.map((u, i) => {
      const base = {
        'S.No':        i + 1,
        'Name':        u.name || '',
        'Email':       u.email || '',
        'Phone':       u.phone || '',
        'City':        u.location?.city || '',
        'State':       u.location?.state || '',
        'Pincode':     u.location?.pincode || '',
        'Address':     u.location?.address || '',
        'Joined':      u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '',
      };
      if (role === 'worker') {
        Object.assign(base, {
          'Skills':          (u.workerProfile?.skills || []).join(', '),
          'Experience (yrs)':u.workerProfile?.experience || 0,
          'Hourly Rate (Rs)':u.workerProfile?.hourlyRate || 0,
          'Rating':          u.workerProfile?.rating || 0,
          'Total Jobs':      u.workerProfile?.totalJobs || 0,
          'Total Reviews':   u.workerProfile?.totalReviews || 0,
          'Completion Rate': u.workerProfile?.completionRate || 0,
          'Verification':    u.workerProfile?.verificationStatus || 'pending',
          'Available':       u.workerProfile?.availability ? 'Yes' : 'No',
          'Bio':             u.workerProfile?.bio || '',
        });
      } else {
        Object.assign(base, {
          'Total Spent (Rs)': u.totalSpent || 0,
          'Loyalty Points':   u.loyaltyPoints || 0,
          'Trusted Customer': u.trustedCustomer ? 'Yes' : 'No',
        });
      }
      return base;
    });

    const headers = Object.keys(rows[0] || {});

    // ── CSV ──────────────────────────────────────────────────────────
    if (format === 'csv') {
      const escape = (v) => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [
        headers.map(escape).join(','),
        ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send('\uFEFF' + csv); // BOM for Excel UTF-8
    }

    // ── JSON ─────────────────────────────────────────────────────────
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.json({ exported_at: new Date(), type, total: rows.length, data: rows });
    }

    // ── Excel (XLSX via SpreadsheetML XML — no npm package needed) ───
    if (format === 'excel') {
      const xmlRows = rows.map(r =>
        '<Row>' + headers.map(h => {
          const v = String(r[h] ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          const isNum = !isNaN(r[h]) && r[h] !== '';
          return isNum
            ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
            : `<Cell><Data ss:Type="String">${v}</Data></Cell>`;
        }).join('') + '</Row>'
      ).join('\n');

      const headerRow = '<Row>' + headers.map(h =>
        `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`
      ).join('') + '</Row>';

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF" ss:Bold="1"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${type.charAt(0).toUpperCase()+type.slice(1)}">
    <Table>
      ${headerRow}
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;

      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xls"`);
      return res.send(xml);
    }

    res.status(400).json({ message: 'Invalid format. Use csv, json, or excel.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
