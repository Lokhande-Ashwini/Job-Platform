const express = require('express');
const {
  getNotifications, markAsRead, markAllAsRead,
  deleteNotification, deleteAll, getUnreadCounts, createAnnouncement,
} = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.get('/',              getNotifications);
router.get('/unread-counts', getUnreadCounts);
router.patch('/read-all',    markAllAsRead);
router.delete('/all',        deleteAll);
router.patch('/:id/read',    markAsRead);
router.delete('/:id',        deleteNotification);

// Admin
router.post('/announcement', adminOnly, createAnnouncement);

module.exports = router;
