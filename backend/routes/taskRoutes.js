const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const taskController = require('../controllers/taskController');

// All routes require authentication
router.use(authMiddleware);

// Task management
router.get('/meeting/:meetingId', taskController.getTasksByMeeting);
router.post('/', taskController.createTask);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

// AI-powered features
router.post('/:meetingId/detect-tasks', taskController.detectTasksForMeeting);
router.post('/meetings/:meetingId/summary', taskController.generateSummary);

// Email management
router.post('/meetings/:meetingId/email', taskController.generateAndSendEmail);
router.get('/meetings/:meetingId/emails', taskController.getEmailsForMeeting);
router.post('/emails/:emailId/send', taskController.sendEmail);

module.exports = router;
