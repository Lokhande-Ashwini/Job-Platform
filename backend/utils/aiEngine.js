/**
 * AI Engine — Hyperlocal Jobs
 * Practical ML-style algorithms for a final-year project.
 * No external API needed — all logic runs server-side.
 */

// ─── 1. REVIEW SENTIMENT ANALYSIS ───────────────────────────────────────────
const POSITIVE_WORDS = [
  'excellent','amazing','great','good','fantastic','wonderful','perfect','outstanding',
  'professional','helpful','skilled','efficient','punctual','clean','honest','reliable',
  'recommend','satisfied','happy','pleased','impressed','best','superb','brilliant',
  'quick','fast','thorough','polite','friendly','expert','quality','value','worth'
];
const NEGATIVE_WORDS = [
  'bad','poor','terrible','awful','horrible','worst','disappointing','unprofessional',
  'late','rude','careless','sloppy','overpriced','expensive','slow','incomplete',
  'broken','damaged','waste','fraud','cheat','liar','useless','incompetent','dirty',
  'never','avoid','regret','angry','upset','frustrated','problem','issue','wrong'
];

exports.analyzeSentiment = (text) => {
  if (!text || text.trim().length === 0) return { label: 'neutral', score: 0.5, emoji: '😐' };
  const lower = text.toLowerCase();
  const words = lower.split(/\W+/);
  let pos = 0, neg = 0;
  words.forEach(w => {
    if (POSITIVE_WORDS.includes(w)) pos++;
    if (NEGATIVE_WORDS.includes(w)) neg++;
  });
  const total = pos + neg;
  if (total === 0) return { label: 'neutral', score: 0.5, emoji: '😐' };
  const score = pos / total;
  if (score >= 0.65) return { label: 'positive', score: parseFloat(score.toFixed(2)), emoji: '😊' };
  if (score <= 0.35) return { label: 'negative', score: parseFloat(score.toFixed(2)), emoji: '😞' };
  return { label: 'neutral', score: parseFloat(score.toFixed(2)), emoji: '😐' };
};

// ─── 2. PRICE FAIRNESS ANALYSIS ─────────────────────────────────────────────
// Market average rates per skill (₹/hr) — realistic Indian market data
const MARKET_RATES = {
  'Electrician':    { min: 150, avg: 350, max: 700 },
  'Plumber':        { min: 150, avg: 300, max: 600 },
  'Carpenter':      { min: 200, avg: 450, max: 900 },
  'Mechanic':       { min: 200, avg: 500, max: 1000 },
  'Tutor':          { min: 150, avg: 400, max: 800 },
  'Painter':        { min: 100, avg: 250, max: 500 },
  'Cleaner':        { min: 100, avg: 200, max: 400 },
  'Gardener':       { min: 150, avg: 300, max: 600 },
  'AC Technician':  { min: 200, avg: 450, max: 900 },
  'Appliance Repair':{ min: 150, avg: 350, max: 700 },
};

exports.analyzePriceFairness = (skill, hourlyRate) => {
  const market = MARKET_RATES[skill] || { min: 100, avg: 350, max: 800 };
  const rate = parseFloat(hourlyRate);
  let label, color, suggestion;

  if (rate < market.min) {
    label = 'Very Low';
    color = '#0ea5e9';
    suggestion = `Rate seems very low. Market average for ${skill} is ₹${market.avg}/hr. Consider raising to attract quality customers.`;
  } else if (rate <= market.avg * 0.85) {
    label = 'Budget Friendly';
    color = '#10b981';
    suggestion = `Good value! Your rate is below market average (₹${market.avg}/hr). Great for attracting new customers.`;
  } else if (rate <= market.avg * 1.15) {
    label = 'Fair Price';
    color = '#6366f1';
    suggestion = `Your rate is in line with the market average of ₹${market.avg}/hr for ${skill}.`;
  } else if (rate <= market.max) {
    label = 'Premium';
    color = '#f59e0b';
    suggestion = `Your rate is above average. Ensure your profile shows strong experience and reviews to justify ₹${rate}/hr.`;
  } else {
    label = 'Very High';
    color = '#ef4444';
    suggestion = `Rate is significantly above market (max ~₹${market.max}/hr for ${skill}). This may reduce bookings.`;
  }

  return {
    label,
    color,
    suggestion,
    marketAvg: market.avg,
    marketMin: market.min,
    marketMax: market.max,
    percentile: Math.round(Math.min(100, Math.max(0, ((rate - market.min) / (market.max - market.min)) * 100)))
  };
};

// ─── 3. WORKER TRUST SCORE ───────────────────────────────────────────────────
// Delegates to the dedicated trustScore utility for consistency
exports.calculateTrustScore = (worker, bookings = []) => {
  const { calculateWorkerTrustScore } = require('./trustScore');
  return calculateWorkerTrustScore(worker, bookings);
};

// ─── 4. SMART RECOMMENDATION LABELS ─────────────────────────────────────────
exports.getRecommendationLabel = (worker, index, allWorkers, userLat, userLng) => {
  const p = worker.workerProfile || {};
  const rate = p.hourlyRate || 0;
  const rating = p.rating || 0;
  const exp = p.experience || 0;
  const dist = worker.distance || 999;
  const score = worker.recommendationScore || 0;

  // Find market context
  const rates = allWorkers.map(w => w.workerProfile?.hourlyRate || 0).filter(r => r > 0);
  const avgRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 350;

  if (index === 0 && score > 60) return { label: '🏆 Best Match', color: '#6366f1', bg: '#ede9fe', reason: 'Highest overall score based on distance, rating, and experience' };
  if (rate < avgRate * 0.75) return { label: '💰 Budget Friendly', color: '#059669', bg: '#d1fae5', reason: `₹${rate}/hr — below average rate for this skill` };
  if (dist < 2) return { label: '⚡ Fastest Nearby', color: '#d97706', bg: '#fef3c7', reason: `Only ${dist.toFixed(1)} km away — fastest response time` };
  if (rating >= 4.8 && p.totalReviews >= 5) return { label: '⭐ Highly Rated', color: '#be185d', bg: '#fdf2f8', reason: `${rating.toFixed(1)} stars from ${p.totalReviews} verified reviews` };
  if (exp >= 8) return { label: '🎓 Expert', color: '#7c3aed', bg: '#f5f3ff', reason: `${exp} years of professional experience` };
  if (p.verificationStatus === 'verified' && p.totalJobs >= 50) return { label: '✅ Top Verified', color: '#0369a1', bg: '#e0f2fe', reason: `Verified with ${p.totalJobs} completed jobs` };
  if (p.completionRate >= 95) return { label: '🎯 Reliable', color: '#0f766e', bg: '#f0fdfa', reason: `${p.completionRate}% job completion rate` };
  return null;
};

// ─── 5. FRAUD / SUSPICIOUS ACTIVITY FLAGS ───────────────────────────────────
exports.detectSuspiciousActivity = (worker, bookings) => {
  const flags = [];
  const p = worker.workerProfile || {};

  // High cancellation rate
  const total = bookings.length;
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;
  if (total >= 5 && cancelled / total > 0.4) {
    flags.push({ type: 'high_cancellation', severity: 'warning', message: `High cancellation rate: ${Math.round((cancelled/total)*100)}% of bookings cancelled` });
  }

  // Abnormally high price vs market
  const skill = p.skills?.[0];
  if (skill) {
    const market = MARKET_RATES[skill] || { max: 800 };
    if (p.hourlyRate > market.max * 1.5) {
      flags.push({ type: 'price_anomaly', severity: 'warning', message: `Hourly rate ₹${p.hourlyRate} is ${Math.round((p.hourlyRate/market.max)*100)}% above market max for ${skill}` });
    }
  }

  // High complaint ratio
  const disputes = bookings.filter(b => b.hasDispute).length;
  if (total >= 3 && disputes / total > 0.3) {
    flags.push({ type: 'high_disputes', severity: 'danger', message: `High dispute rate: ${disputes} disputes out of ${total} bookings` });
  }

  // Rating vs reviews mismatch (high rating but very few reviews)
  if (p.rating >= 4.9 && p.totalReviews < 3 && p.totalJobs > 20) {
    flags.push({ type: 'rating_anomaly', severity: 'info', message: `Very high rating (${p.rating}) with only ${p.totalReviews} reviews — may need verification` });
  }

  return flags;
};

// ─── 6. PRICE SUGGESTION FOR BOOKING ────────────────────────────────────────
exports.suggestBookingPrice = (skill, workerRate, estimatedHours = 2) => {
  const market = MARKET_RATES[skill] || { min: 150, avg: 350, max: 700 };
  const suggested = Math.round(workerRate * estimatedHours);
  const marketSuggested = Math.round(market.avg * estimatedHours);

  return {
    suggested,
    marketSuggested,
    min: Math.round(market.min * estimatedHours),
    max: Math.round(market.max * estimatedHours),
    isFair: suggested <= market.max * estimatedHours * 1.1,
    tip: suggested > marketSuggested * 1.3
      ? `This estimate is above market average (₹${marketSuggested} for ${estimatedHours}hrs). You can negotiate.`
      : `Fair estimate. Market average for ${estimatedHours}hrs is ₹${marketSuggested}.`
  };
};
