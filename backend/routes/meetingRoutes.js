const express = require('express');
const router = express.Router();
const {
  startMeeting,
  stopMeeting,
  getAllMeetings,
  getMeetingById,
  deleteMeeting
} = require('../controllers/meetingController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Start meeting
router.post('/start', startMeeting);

// Stop meeting
router.post('/:id/stop', stopMeeting);

// Get all meetings
router.get('/', getAllMeetings);

// Get meeting by ID
router.get('/:id', getMeetingById);

// Delete meeting
router.delete('/:id', deleteMeeting);

module.exports = router;
