const express = require('express');
const { sendMessage, getMessages, getConversations, getUnreadMessageCount } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadMessageCount);
router.get('/:bookingId', protect, getMessages);

module.exports = router;
