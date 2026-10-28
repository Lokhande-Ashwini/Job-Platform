const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Avatar upload
    if (req.file && req.file.buffer) {
      try {
        const base64Image = req.file.buffer.toString('base64');
        const mimetype = req.file.mimetype.startsWith('image/') ? req.file.mimetype : 'image/jpeg';
        user.avatar = `data:${mimetype};base64,${base64Image}`;
      } catch (uploadError) {
        return res.status(500).json({ message: 'Failed to process image: ' + uploadError.message });
      }
    }

    // Basic fields
    if (req.body.name) {
      if (req.body.name.trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters' });
      user.name = req.body.name.trim();
    }
    if (req.body.phone) {
      const phoneClean = req.body.phone.replace(/\s/g, '');
      if (phoneClean.length < 10) return res.status(400).json({ message: 'Phone must be at least 10 digits' });
      user.phone = phoneClean;
    }

    // Email update with duplicate check
    if (req.body.email && req.body.email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) return res.status(400).json({ message: 'Invalid email address' });
      const existing = await User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ message: 'Email is already in use' });
      user.email = req.body.email.toLowerCase().trim();
    }

    // Location fields (inline, without map picker)
    if (req.body.address !== undefined || req.body.city !== undefined || req.body.state !== undefined || req.body.pincode !== undefined) {
      user.location = {
        ...user.location?.toObject?.() || user.location || {},
        type: 'Point',
        coordinates: user.location?.coordinates || [0, 0],
        address: req.body.address ?? user.location?.address ?? '',
        city: req.body.city ?? user.location?.city ?? '',
        state: req.body.state ?? user.location?.state ?? '',
        pincode: req.body.pincode ?? user.location?.pincode ?? '',
      };
    }

    // Worker profile fields
    if (req.body.workerProfile && user.role === 'worker') {
      let workerProfile = req.body.workerProfile;
      if (typeof workerProfile === 'string') {
        try { workerProfile = JSON.parse(workerProfile); } catch {}
      }
      if (workerProfile) {
        const existing = user.workerProfile?.toObject ? user.workerProfile.toObject() : (user.workerProfile || {});
        // Validate hourlyRate
        if (workerProfile.hourlyRate !== undefined && (isNaN(workerProfile.hourlyRate) || workerProfile.hourlyRate < 0)) {
          return res.status(400).json({ message: 'Hourly rate must be a positive number' });
        }
        // Validate experience
        if (workerProfile.experience !== undefined && (isNaN(workerProfile.experience) || workerProfile.experience < 0)) {
          return res.status(400).json({ message: 'Experience must be a positive number' });
        }
        // Normalize availability field (frontend may send 'available' or 'availability')
        if (workerProfile.available !== undefined) {
          workerProfile.availability = workerProfile.available;
          delete workerProfile.available;
        }
        user.workerProfile = { ...existing, ...workerProfile };
      }
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;

    // Return with profileCompletion
    const { getCustomerCompletion, getWorkerCompletion, getAdminCompletion } = require('../utils/profileCompletion');
    if (user.role === 'worker') userObj.profileCompletion = getWorkerCompletion(user);
    else if (user.role === 'admin') userObj.profileCompletion = getAdminCompletion(user);
    else userObj.profileCompletion = getCustomerCompletion(user);

    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address, city, state, pincode } = req.body;
    const user = await User.findById(req.user.id);
    user.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0],
      address: address || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
    };
    await user.save();
    res.json({ message: 'Location updated successfully', location: user.location });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Worker: toggle online/offline status
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    if (req.user.role !== 'worker') return res.status(403).json({ message: 'Workers only' });
    await User.findByIdAndUpdate(req.user.id, {
      'workerProfile.isOnline': !!isOnline,
      'workerProfile.lastSeen': new Date(),
    });
    res.json({ ok: true, isOnline: !!isOnline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = null;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    
    res.json({ message: 'Profile picture removed successfully', user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Worker: submit verification documents (ID + selfie + optional skill proof)
exports.submitVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'worker') return res.status(403).json({ message: 'Workers only' });

    const { idDocument, idDocumentType, photoVerification, skillProof } = req.body;

    if (idDocument) user.workerProfile.idDocument = idDocument;
    if (idDocumentType) user.workerProfile.idDocumentType = idDocumentType;
    if (photoVerification) user.workerProfile.photoVerification = photoVerification;
    if (skillProof) user.workerProfile.skillProof = skillProof;

    // Only move to 'submitted' if ID doc present (selfie optional but encouraged)
    if (user.workerProfile.idDocument) {
      const prevStatus = user.workerProfile.verificationStatus;
      user.workerProfile.verificationStatus = 'submitted';
      user.workerProfile.verificationSubmittedAt = new Date();

      // Log to history
      if (!user.workerProfile.verificationHistory) user.workerProfile.verificationHistory = [];
      user.workerProfile.verificationHistory.push({
        status: 'submitted',
        note: prevStatus === 'resubmission-required' ? 'Re-submitted after admin request' : 'Initial submission',
        at: new Date()
      });
    }

    await user.save();
    const userObj = user.toObject(); delete userObj.password;
    res.json({ message: 'Verification documents submitted', user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: take action on worker verification
exports.adminVerifyWorker = async (req, res) => {
  try {
    const { status, reason, adminNote } = req.body;
    // status: 'verified' | 'rejected' | 'resubmission-required'
    const validStatuses = ['verified', 'rejected', 'resubmission-required'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const worker = await User.findById(req.params.id);
    if (!worker || worker.role !== 'worker') return res.status(404).json({ message: 'Worker not found' });

    const prevStatus = worker.workerProfile.verificationStatus;
    worker.workerProfile.verificationStatus = status;
    worker.workerProfile.verificationReviewedBy = req.user.id;
    if (adminNote) worker.workerProfile.verificationAdminNote = adminNote;

    if (status === 'verified') {
      worker.workerProfile.verificationApprovedAt = new Date();
      worker.workerProfile.verificationRejectedReason = undefined;
    } else if (status === 'rejected') {
      worker.workerProfile.verificationRejectedAt = new Date();
      worker.workerProfile.verificationRejectedReason = reason || 'Documents not acceptable';
    } else if (status === 'resubmission-required') {
      worker.workerProfile.verificationRejectedReason = reason || 'Please re-submit with clearer documents';
    }

    // Append to history
    if (!worker.workerProfile.verificationHistory) worker.workerProfile.verificationHistory = [];
    worker.workerProfile.verificationHistory.push({
      status,
      note: reason || adminNote || '',
      by: req.user.id,
      byName: req.user.name,
      at: new Date()
    });

    await worker.save();

    // Notify worker
    const Notification = require('../models/Notification');
    const msgs = {
      verified: { title: '✅ Verification Approved!', message: 'Congratulations! Your identity has been verified. You now have a Verified badge.' },
      rejected: { title: '❌ Verification Rejected', message: `Your verification was rejected. Reason: ${reason || 'Documents not acceptable'}. Please re-submit.` },
      'resubmission-required': { title: '🔄 Resubmission Required', message: `Admin has requested you re-submit your documents. Note: ${reason || 'Please provide clearer documents.'}` },
    };
    await Notification.create({
      user: worker._id,
      title: msgs[status].title,
      message: msgs[status].message,
      type: 'verification',
      relatedId: worker._id,
    }).catch(() => {});

    res.json({ message: `Worker verification: ${status}`, worker });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: grant or revoke trusted customer badge
exports.setTrustedCustomer = async (req, res) => {
  try {
    const { trusted, note } = req.body;
    const customer = await User.findById(req.params.id);
    if (!customer || customer.role !== 'customer') return res.status(404).json({ message: 'Customer not found' });

    customer.trustedCustomer = !!trusted;
    if (trusted) {
      customer.trustedCustomerGrantedAt = new Date();
      customer.trustedCustomerNote = note || 'Granted by admin';
      customer.trustedCustomerGrantedBy = req.user.id;
    } else {
      customer.trustedCustomerGrantedAt = undefined;
      customer.trustedCustomerNote = undefined;
      customer.trustedCustomerGrantedBy = undefined;
    }
    await customer.save();

    const Notification = require('../models/Notification');
    await Notification.create({
      user: customer._id,
      title: trusted ? '🏅 Trusted Customer Badge Granted!' : 'Trusted Badge Removed',
      message: trusted
        ? 'You have been granted the Trusted Customer badge. Thank you for being a valued member!'
        : 'Your Trusted Customer badge has been removed.',
      type: 'system',
      relatedId: customer._id,
    }).catch(() => {});

    res.json({ message: `Customer trusted status: ${trusted}`, customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate and update customer trust score
exports.calculateCustomerTrust = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const Dispute = require('../models/Dispute');
    const customerId = req.params.id || req.user.id;

    // Only admin can calculate for others; users can calculate their own
    if (req.user.role !== 'admin' && req.user.id !== customerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const customer = await User.findById(customerId);
    if (!customer || customer.role !== 'customer') return res.status(404).json({ message: 'Customer not found' });

    const completedBookings = await Booking.countDocuments({ customer: customerId, status: 'completed' });
    const openDisputes = await Dispute.countDocuments({ raisedBy: customerId, status: { $in: ['open', 'under-review'] } });
    const { getCustomerCompletion } = require('../utils/profileCompletion');
    const completion = getCustomerCompletion(customer);

    const factors = {
      phoneVerified:    !!(customer.phone && customer.phone.replace(/\D/g,'').length >= 10),
      emailVerified:    !!customer.email,
      hasCompletedBookings: completedBookings >= 1,
      noDisputes:       openDisputes === 0,
      profileComplete:  completion.percentage >= 80,
    };

    // Score: each factor worth 20 points
    const score = Object.values(factors).filter(Boolean).length * 20;

    customer.customerTrustScore = { ...factors, score, lastCalculated: new Date() };
    await customer.save();

    res.json({ factors, score, customer: customer.toObject() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get trust score for current user (or specific user for admin)
exports.getTrustScore = async (req, res) => {
  try {
    const targetId = req.params.id || req.user.id;
    // Only admin can view others' trust scores
    if (req.user.role !== 'admin' && req.user.id !== targetId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const user = await User.findById(targetId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { computeWorkerTrustScore, computeCustomerTrustScore } = require('../utils/trustScore');
    let trustScore;
    if (user.role === 'worker') trustScore = await computeWorkerTrustScore(user);
    else if (user.role === 'customer') trustScore = await computeCustomerTrustScore(user);
    else return res.status(400).json({ message: 'Trust score not applicable for this role' });

    res.json(trustScore);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark user as no longer new (dismiss setup prompt)
exports.dismissNewUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isNewUser: false });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get profile completion for current user (lightweight endpoint)
exports.getCompletion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const { getCustomerCompletion, getWorkerCompletion, getAdminCompletion } = require('../utils/profileCompletion');
    let completion;
    if (user.role === 'worker') completion = getWorkerCompletion(user);
    else if (user.role === 'admin') completion = getAdminCompletion(user);
    else completion = getCustomerCompletion(user);
    res.json(completion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkerStats = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const workerId = req.params.id || req.user.id;

    const [statusStats, monthlyEarnings, totals] = await Promise.all([
      Booking.aggregate([
        { $match: { worker: new (require('mongoose').Types.ObjectId)(workerId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        {
          $match: {
            worker: new (require('mongoose').Types.ObjectId)(workerId),
            status: 'completed',
            createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
          }
        },
        {
          $group: {
            _id: { $month: { $ifNull: ['$completedAt', '$createdAt'] } },
            earnings: { $sum: '$amount' },
            jobs: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Booking.aggregate([
        { $match: { worker: new (require('mongoose').Types.ObjectId)(workerId) } },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            completedJobs: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalEarnings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } }
          }
        }
      ])
    ]);

    const t = totals[0] || { totalJobs: 0, completedJobs: 0, totalEarnings: 0 };
    res.json({
      stats: statusStats,
      monthlyEarnings,
      totalJobs: t.totalJobs,
      completedJobs: t.completedJobs,
      totalEarnings: t.totalEarnings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
