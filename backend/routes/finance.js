const express = require('express');
const {
  getBreakdownPreview, getWorkerEarnings, getPayoutDetail,
  getTransactionDetail, getAdminRevenue, updatePayoutStatus,
  getPlatformSettings, updatePlatformSettings, getAllPayouts,
  getCustomerTransactions, getAdminProfitAnalytics, getAdminTaxSummary, exportCSV,
} = require('../controllers/financeController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// Customer
router.get('/breakdown/:bookingId',    getBreakdownPreview);
router.get('/transaction/:bookingId',  getTransactionDetail);
router.get('/customer/transactions',   getCustomerTransactions);

// Worker
router.get('/worker/earnings',         getWorkerEarnings);
router.get('/worker/payout/:id',       getPayoutDetail);

// Admin
router.get('/admin/revenue',           adminOnly, getAdminRevenue);
router.get('/admin/profit-analytics',  adminOnly, getAdminProfitAnalytics);
router.get('/admin/payouts',           adminOnly, getAllPayouts);
router.patch('/admin/payout/:id',      adminOnly, updatePayoutStatus);
router.get('/admin/settings',          adminOnly, getPlatformSettings);
router.patch('/admin/settings',        adminOnly, updatePlatformSettings);
router.get('/admin/tax-summary',       adminOnly, getAdminTaxSummary);
router.get('/admin/export',            adminOnly, exportCSV);

module.exports = router;
