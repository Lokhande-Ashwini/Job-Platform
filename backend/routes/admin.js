const express = require('express');
const {
  checkAdminExists,
  createFirstAdmin,
  getAllUsers,
  getAllCustomers,
  getPendingWorkers,
  updateWorkerVerification,
  getPlatformStats,
  deleteUser,
  updateWorker,
  getAllWorkers,
  getAllBookings,
  getAdminUser,
  exportUsersData,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public — first-time setup
router.get('/check', checkAdminExists);
router.post('/setup', createFirstAdmin);

// All routes below require admin authentication
router.use(protect);

// Any authenticated user can get admin contact info (for chat initiation)
router.get('/admin-user', getAdminUser);

router.use(adminOnly);

router.get('/users', getAllUsers);
router.get('/customers', getAllCustomers);
router.get('/workers', getAllWorkers);
router.get('/workers/pending', getPendingWorkers);
router.get('/bookings', getAllBookings);
router.patch('/workers/:id/verify', updateWorkerVerification);
router.patch('/workers/:id', updateWorker);
router.delete('/users/:id', deleteUser);
router.get('/stats', getPlatformStats);
// Export endpoint: /api/admin/export?type=workers&format=csv|json|excel
router.get('/export', exportUsersData);

module.exports = router;
