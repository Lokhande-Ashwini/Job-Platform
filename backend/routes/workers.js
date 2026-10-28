const express = require('express');
const { searchWorkers, getWorkerById } = require('../controllers/workerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public route - anyone can search for workers
router.get('/search', searchWorkers);
// Protected route - need auth to view specific worker details
router.get('/:id', protect, getWorkerById);

module.exports = router;
