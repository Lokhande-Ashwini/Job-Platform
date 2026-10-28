/**
 * Profile completion calculator — Hyperlocal Jobs
 * Returns percentage, weighted fields, missing items, and next-step hints.
 */

// ── Customer completion ───────────────────────────────────────────────────────
const getCustomerCompletion = (user) => {
  const loc = user.location || {};
  const fields = [
    {
      key: 'avatar',
      label: 'Profile photo',
      hint: 'Upload a clear profile photo so workers recognise you',
      icon: '📷',
      done: !!user.avatar,
      weight: 15,
      priority: 1,
    },
    {
      key: 'name',
      label: 'Full name',
      hint: 'Add your full name',
      icon: '👤',
      done: !!(user.name && user.name.trim().length > 1),
      weight: 15,
      priority: 1,
    },
    {
      key: 'phone',
      label: 'Phone number',
      hint: 'Add a 10-digit mobile number',
      icon: '📞',
      done: !!(user.phone && user.phone.replace(/\D/g, '').length >= 10),
      weight: 15,
      priority: 1,
    },
    {
      key: 'email',
      label: 'Email address',
      hint: 'Verify your email address',
      icon: '✉️',
      done: !!user.email,
      weight: 10,
      priority: 2,
    },
    {
      key: 'city',
      label: 'City / Area',
      hint: 'Add your city so workers near you can find you',
      icon: '📍',
      done: !!(loc.city || loc.address),
      weight: 15,
      priority: 1,
    },
    {
      key: 'address',
      label: 'Full address',
      hint: 'Add your street address for accurate service',
      icon: '🏠',
      done: !!(loc.address && loc.address.trim().length > 3),
      weight: 10,
      priority: 2,
    },
    {
      key: 'state',
      label: 'State & Pincode',
      hint: 'Add your state and pincode',
      icon: '🗺️',
      done: !!(loc.state && loc.pincode),
      weight: 10,
      priority: 3,
    },
    {
      key: 'contact_ready',
      label: 'Contact readiness',
      hint: 'Have both phone and email filled for quick contact',
      icon: '📬',
      done: !!(user.phone && user.email),
      weight: 10,
      priority: 2,
    },
  ];

  return _buildResult(fields, { isTrusted: !!user.trustedCustomer });
};

// ── Worker completion ─────────────────────────────────────────────────────────
const getWorkerCompletion = (user) => {
  const wp = user.workerProfile || {};
  const loc = user.location || {};

  const fields = [
    {
      key: 'avatar',
      label: 'Profile photo',
      hint: 'Upload a professional profile photo',
      icon: '📷',
      done: !!user.avatar,
      weight: 10,
      priority: 1,
    },
    {
      key: 'name',
      label: 'Full name',
      hint: 'Add your full name',
      icon: '👤',
      done: !!(user.name && user.name.trim().length > 1),
      weight: 8,
      priority: 1,
    },
    {
      key: 'phone',
      label: 'Phone number',
      hint: 'Add a 10-digit mobile number',
      icon: '📞',
      done: !!(user.phone && user.phone.replace(/\D/g, '').length >= 10),
      weight: 8,
      priority: 1,
    },
    {
      key: 'city',
      label: 'Service area / City',
      hint: 'Add your city so customers can find you',
      icon: '📍',
      done: !!(loc.city || loc.address),
      weight: 8,
      priority: 1,
    },
    {
      key: 'address',
      label: 'Full address',
      hint: 'Add your complete address',
      icon: '🏠',
      done: !!(loc.address && loc.address.trim().length > 3),
      weight: 5,
      priority: 2,
    },
    {
      key: 'skills',
      label: 'Skills selected',
      hint: 'Select at least one skill you offer',
      icon: '🔧',
      done: !!(wp.skills && wp.skills.length > 0),
      weight: 10,
      priority: 1,
    },
    {
      key: 'experience',
      label: 'Years of experience',
      hint: 'Add how many years of experience you have',
      icon: '🏆',
      done: !!(wp.experience && wp.experience > 0),
      weight: 8,
      priority: 1,
    },
    {
      key: 'hourlyRate',
      label: 'Hourly rate',
      hint: 'Set your hourly rate so customers know your pricing',
      icon: '💰',
      done: !!(wp.hourlyRate && wp.hourlyRate > 0),
      weight: 8,
      priority: 1,
    },
    {
      key: 'bio',
      label: 'About / Bio',
      hint: 'Write a short bio (at least 20 characters)',
      icon: '📝',
      done: !!(wp.bio && wp.bio.trim().length > 20),
      weight: 8,
      priority: 2,
    },
    {
      key: 'availability',
      label: 'Availability set',
      hint: 'Set your availability status',
      icon: '🟢',
      done: wp.availability !== undefined,
      weight: 5,
      priority: 2,
    },
    {
      key: 'idDocument',
      label: 'ID document uploaded',
      hint: 'Upload Aadhaar, PAN, or Driving License for verification',
      icon: '🪪',
      done: !!wp.idDocument,
      weight: 12,
      priority: 1,
    },
    {
      key: 'photoVerif',
      label: 'Verification selfie',
      hint: 'Upload a selfie holding your ID for identity verification',
      icon: '🤳',
      done: !!wp.photoVerification,
      weight: 10,
      priority: 2,
    },
  ];

  return _buildResult(fields, {
    verificationStatus: wp.verificationStatus || 'pending',
    hasIdDocument: !!wp.idDocument,
    hasPhotoVerif: !!wp.photoVerification,
    isVerified: wp.verificationStatus === 'verified',
  });
};

// ── Admin completion ──────────────────────────────────────────────────────────
const getAdminCompletion = (user) => {
  const fields = [
    {
      key: 'avatar',
      label: 'Profile photo',
      hint: 'Upload a profile photo',
      icon: '📷',
      done: !!user.avatar,
      weight: 30,
      priority: 1,
    },
    {
      key: 'name',
      label: 'Full name',
      hint: 'Add your full name',
      icon: '👤',
      done: !!(user.name && user.name.trim().length > 1),
      weight: 35,
      priority: 1,
    },
    {
      key: 'phone',
      label: 'Phone number',
      hint: 'Add a contact phone number',
      icon: '📞',
      done: !!(user.phone && user.phone.replace(/\D/g, '').length >= 10),
      weight: 35,
      priority: 1,
    },
  ];

  return _buildResult(fields, {});
};

// ── Internal builder ──────────────────────────────────────────────────────────
const _buildResult = (fields, extra = {}) => {
  const totalWeight = fields.reduce((s, f) => s + f.weight, 0);
  const doneWeight  = fields.filter(f => f.done).reduce((s, f) => s + f.weight, 0);
  const done        = fields.filter(f => f.done).length;
  const missing     = fields.filter(f => !f.done);
  const percentage  = Math.round((doneWeight / totalWeight) * 100);

  // Next recommended action — highest priority incomplete field
  const nextStep = missing.sort((a, b) => a.priority - b.priority)[0] || null;

  // Tier label
  const tier =
    percentage === 100 ? 'complete' :
    percentage >= 80   ? 'almost'   :
    percentage >= 50   ? 'halfway'  :
    percentage >= 25   ? 'started'  : 'new';

  return {
    percentage,
    fields,
    missing: missing.map(f => f.label),
    missingFields: missing,   // full objects with hints/icons
    total: fields.length,
    done,
    tier,
    nextStep,
    ...extra,
  };
};

module.exports = { getCustomerCompletion, getWorkerCompletion, getAdminCompletion };
