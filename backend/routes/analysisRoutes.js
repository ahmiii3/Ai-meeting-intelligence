const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { 
  analyzeMeeting, 
  getMeetingSummary, 
  getActionItems 
} = require('../controllers/analysisController');

/**
 * GET /api/analysis/meeting/:meetingId
 * Analyze a complete meeting transcript
 * Query params:
 * - includeAnalysis=true (default) - perform analysis
 * - includeSummary=true (optional) - also generate summary
 */
router.get('/meeting/:meetingId', authMiddleware, analyzeMeeting);

/**
 * GET /api/analysis/meeting/:meetingId/summary
 * Get or generate comprehensive meeting summary
 */
router.get('/meeting/:meetingId/summary', authMiddleware, getMeetingSummary);

/**
 * GET /api/analysis/meeting/:meetingId/action-items
 * Get detected action items, tasks, and decisions
 */
router.get('/meeting/:meetingId/action-items', authMiddleware, getActionItems);

module.exports = router;
