const User = require('../models/User');
const { getRecommendationLabel, calculateTrustScore } = require('../utils/aiEngine');

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const calculateRecommendationScore = (worker, userLat, userLng) => {
  let score = 0;
  const coords = worker.location?.coordinates;
  const hasLocation = coords && coords[0] !== 0 && coords[1] !== 0;

  if (userLat && userLng && hasLocation) {
    const dist = calculateDistance(userLat, userLng, coords[1], coords[0]);
    score += Math.max(0, 40 - dist * 2);
  }
  score += (worker.workerProfile?.rating || 0) * 6;
  score += Math.min(15, (worker.workerProfile?.experience || 0) * 1.5);
  score += (worker.workerProfile?.completionRate || 0) * 0.1;
  score += Math.min(5, (worker.workerProfile?.totalJobs || 0) * 0.1);
  return score;
};

exports.searchWorkers = async (req, res) => {
  try {
    const { skill, lat, lng, radius = 200000 } = req.query;
    const radiusInt = parseInt(radius);
    const anyDistance = radiusInt === 0 || radiusInt >= 500000;
    const userLat = parseFloat(lat) || 0;
    const userLng = parseFloat(lng) || 0;

    const baseQuery = { role: 'worker' };
    if (skill) {
      baseQuery['workerProfile.skills'] = { $regex: skill, $options: 'i' };
    }

    // Always fetch all matching workers first
    let workers = await User.find(baseQuery).select('-password');

    // Apply radius filter manually using Haversine — most reliable approach
    // This works regardless of whether workers have geospatial index or not
    if (userLat && userLng && !anyDistance) {
      const maxKm = radiusInt / 1000;
      workers = workers.filter(w => {
        const c = w.location?.coordinates;
        // Workers without location are excluded when radius is set
        if (!c || (c[0] === 0 && c[1] === 0)) return false;
        const dist = calculateDistance(userLat, userLng, c[1], c[0]);
        return dist <= maxKm;
      });
    }

    const workersWithScores = workers.map(worker => {
      const obj = worker.toObject();
      obj.recommendationScore = calculateRecommendationScore(worker, userLat, userLng);
      const coords = worker.location?.coordinates;
      if (userLat && userLng && coords && coords[0] !== 0 && coords[1] !== 0) {
        obj.distance = calculateDistance(userLat, userLng, coords[1], coords[0]);
      }
      obj.trustScore = calculateTrustScore(worker);
      return obj;
    });

    workersWithScores.sort((a, b) => b.recommendationScore - a.recommendationScore);
    workersWithScores.forEach((w, i) => {
      w.aiLabel = getRecommendationLabel(w, i, workersWithScores, userLat, userLng);
    });

    res.json(workersWithScores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkerById = async (req, res) => {
  try {
    const worker = await User.findOne({ _id: req.params.id, role: 'worker' }).select('-password');
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
