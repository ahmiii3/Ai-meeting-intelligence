const Task = require('../models/Task');
const Meeting = require('../models/Meeting');
const EmailLog = require('../models/EmailLog');
const { detectTasksFromTranscript, generateMeetingSummary, extractDecisions } = require('../services/taskDetectionService');
const { generateFollowupEmail, formatEmailAsHTML } = require('../services/emailGenerationService');

/**
 * Get all tasks for a meeting
 * GET /api/tasks/meeting/:meetingId
 */
exports.getTasksByMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status } = req.query;

    // Verify meeting exists
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    let query = { meeting_id: meetingId };
    if (status) {
      query.status = status;
    }

    const tasks = await Task.findAll({
      where: query,
      order: [['priority', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        meetingId: meetingId,
        taskCount: tasks.length,
        tasks: tasks
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create task manually
 * POST /api/tasks
 */
exports.createTask = async (req, res) => {
  try {
    const {
      meeting_id,
      description,
      assignee,
      priority,
      deadline,
      detected_by_ai
    } = req.body;

    // Validate
    if (!meeting_id || !description) {
      return res.status(400).json({
        success: false,
        error: 'meeting_id and description required'
      });
    }

    const task = await Task.create({
      meeting_id,
      description,
      assignee: assignee || null,
      priority: priority || 'medium',
      deadline: deadline ? new Date(deadline) : null,
      detected_by_ai: detected_by_ai || false,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update task
 * PUT /api/tasks/:taskId
 */
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Allow updating: status, assignee, priority, deadline
    const allowedFields = ['status', 'assignee', 'priority', 'deadline'];
    const updates = {};

    for (const field of allowedFields) {
      if (field in updateData) {
        updates[field] = updateData[field];
      }
    }

    await task.update(updates);

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:taskId
 */
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Trigger task detection on transcript
 * POST /api/meetings/:meetingId/detect-tasks
 */
exports.detectTasksForMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript required'
      });
    }

    // Verify meeting exists
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    // Run task detection
    const detectedTasks = await detectTasksFromTranscript(transcript, meetingId);

    res.json({
      success: true,
      data: {
        meetingId: meetingId,
        tasksDetected: detectedTasks.length,
        tasks: detectedTasks
      }
    });
  } catch (error) {
    console.error('Error detecting tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate meeting summary
 * POST /api/meetings/:meetingId/summary
 */
exports.generateSummary = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { transcript, summaryType = 'detailed' } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript required'
      });
    }

    // Verify meeting exists
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    // Generate summary
    const summaryData = await generateMeetingSummary(transcript, meetingId, summaryType);

    // Extract decisions
    const decisions = await extractDecisions(transcript);

    res.json({
      success: true,
      data: {
        meetingId: meetingId,
        summary: summaryData.summary,
        summaryType: summaryData.summaryType,
        decisions: decisions,
        generatedAt: summaryData.generatedAt
      }
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate and send follow-up email
 * POST /api/meetings/:meetingId/email
 */
exports.generateAndSendEmail = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const {
      recipients = [],
      meetingTitle = 'Meeting Follow-up',
      summary = '',
      recipientType = 'generic'
    } = req.body;

    // Verify meeting exists
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    // Get all tasks for this meeting
    const tasks = await Task.findAll({
      where: { meeting_id: meetingId }
    });

    // Generate email for each recipient
    const emailLogs = [];

    for (const recipient of recipients) {
      const emailData = {
        meetingTitle: meetingTitle,
        summary: summary,
        tasks: tasks,
        decisions: [],
        recipientType: recipientType,
        recipientName: recipient.name || 'Team'
      };

      const emailContent = await generateFollowupEmail(emailData);
      const htmlBody = formatEmailAsHTML(emailContent);

      // Store email log
      const emailLog = await EmailLog.create({
        meeting_id: meetingId,
        recipient: recipient.email,
        recipient_type: recipientType,
        subject: emailContent.subject,
        body: htmlBody,
        email_type: 'followup',
        status: 'draft' // Mark as draft for review
      });

      emailLogs.push({
        recipient: recipient.email,
        subject: emailContent.subject,
        status: 'draft',
        id: emailLog.id
      });
    }

    res.json({
      success: true,
      data: {
        meetingId: meetingId,
        emailsGenerated: emailLogs.length,
        emails: emailLogs,
        message: 'Emails generated as drafts. Review and send manually via email dashboard.'
      }
    });
  } catch (error) {
    console.error('Error generating email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get all emails for a meeting
 * GET /api/meetings/:meetingId/emails
 */
exports.getEmailsForMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Verify meeting exists
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    const emails = await EmailLog.findAll({
      where: { meeting_id: meetingId },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        meetingId: meetingId,
        emailCount: emails.length,
        emails: emails
      }
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Send a draft email
 * POST /api/emails/:emailId/send
 */
exports.sendEmail = async (req, res) => {
  try {
    const { emailId } = req.params;

    const emailLog = await EmailLog.findByPk(emailId);
    if (!emailLog) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    // TODO: Integrate with email service (SendGrid, SMTP, etc.)
    // For now, just mark as sent
    await emailLog.update({
      status: 'sent',
      sent_at: new Date()
    });

    res.json({
      success: true,
      data: emailLog,
      message: 'Email marked as sent (email service integration pending)'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
