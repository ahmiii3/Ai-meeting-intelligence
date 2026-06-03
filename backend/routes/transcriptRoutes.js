const express = require('express');
const router = express.Router();
const {
  getMeetingTranscript,
  deleteTranscript
} = require('../controllers/transcriptController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get transcript for meeting
router.get('/:meetingId', getMeetingTranscript);

// Delete transcript
router.delete('/:meetingId', deleteTranscript);

module.exports = router;
