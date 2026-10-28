const express = require('express');
const { createRequest, getRequestsForWorker, getAllRequests, getMyRequests, respondToRequest, updateWorkerStatus } = require('../controllers/workerChangeRequestController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.post('/', adminOnly, createRequest);
router.get('/all', adminOnly, getAllRequests);
router.get('/worker/:workerId', adminOnly, getRequestsForWorker);
router.get('/my', getMyRequests);
router.patch('/:id/respond', respondToRequest);
router.patch('/worker/:workerId/status', adminOnly, updateWorkerStatus);

module.exports = router;
