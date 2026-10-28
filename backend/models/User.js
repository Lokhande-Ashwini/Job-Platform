const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['customer', 'worker', 'admin'], required: true },
  avatar: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  workerProfile: {
    skills: [String],
    experience: Number,
    hourlyRate: Number,
    bio: String,
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    // Category rating averages
    ratingBreakdown: {
      quality:       { type: Number, default: 0 },
      behavior:      { type: Number, default: 0 },
      punctuality:   { type: Number, default: 0 },
      priceFairness: { type: Number, default: 0 },
    },
    verificationStatus: { 
      type: String, 
      enum: ['pending', 'submitted', 'verified', 'rejected', 'resubmission-required'],
      default: 'pending'
    },
    verificationRejectedReason: String,
    verificationAdminNote: String,       // admin's internal review note
    verificationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verificationSubmittedAt: Date,
    verificationApprovedAt: Date,
    verificationRejectedAt: Date,
    verificationHistory: [{              // full audit trail
      status: String,
      note: String,
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      byName: String,
      at: { type: Date, default: Date.now }
    }],
    // Verification documents (stored as base64 or URL)
    idDocument: String,          // Aadhaar / PAN / Driving License image
    idDocumentType: { type: String, enum: ['aadhaar', 'pan', 'driving-license', 'passport', 'voter-id'], default: 'aadhaar' },
    photoVerification: String,   // Selfie / face photo for identity match
    skillProof: String,          // Certificate / skill proof document
    idProof: String,             // legacy field kept
    isOnline: { type: Boolean, default: false },
    lastSeen: Date
  },
  // Customer trust
  trustedCustomer: { type: Boolean, default: false },
  trustedCustomerGrantedAt: Date,
  trustedCustomerNote: String,
  trustedCustomerGrantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Customer trust score factors
  customerTrustScore: {
    phoneVerified:    { type: Boolean, default: false },
    emailVerified:    { type: Boolean, default: false },
    hasCompletedBookings: { type: Boolean, default: false },
    noDisputes:       { type: Boolean, default: false },
    profileComplete:  { type: Boolean, default: false },
    score:            { type: Number, default: 0 },
    lastCalculated:   Date,
  },
  // Profile completion tracking
  profileCompleted: { type: Boolean, default: false },
  isNewUser: { type: Boolean, default: true },
  loyaltyPoints: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Create geospatial index only if location coordinates exist
userSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
