const express = require('express');
const {
  createThread, getThreads, getAllThreads, sendMessage,
  getThread, markThreadRead, getUnreadCount
} = require('../controllers/adminMessageController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.post('/threads', createThread);
router.get('/threads', getThreads);
router.get('/threads/unread-count', getUnreadCount);
router.get('/threads/all', adminOnly, getAllThreads);
router.get('/threads/:threadId', getThread);
router.post('/threads/:threadId/messages', sendMessage);
router.patch('/threads/:threadId/read', markThreadRead);

module.exports = router;
