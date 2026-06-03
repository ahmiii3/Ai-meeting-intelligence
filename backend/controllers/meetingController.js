const Meeting = require('../models/Meeting');
const { getIO } = require('../config/socket');

/**
 * POST /api/meetings/start
 * Start a new meeting
 */
const startMeeting = async (req, res) => {
  try {
    const { title, platform, meetingUrl, workspaceId } = req.body;
    const userId = req.user.userId;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID is required'
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Meeting title is required'
      });
    }

    // Create new meeting
    const meeting = await Meeting.create({
      user_id: userId,
      workspace_id: workspaceId,
      title,
      platform: platform || 'custom',
      status: 'active',
      start_time: new Date(),
      meeting_url: meetingUrl || null,
      metadata: {}
    });

    // Emit event via Socket.IO
    try {
      const io = getIO();
      io.to(workspaceId).emit('meeting-started', {
        meetingId: meeting.id,
        title: meeting.title,
        startTime: meeting.start_time
      });
    } catch (socketError) {
      console.log('Socket.IO emit warning:', socketError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Meeting started successfully',
      data: { meeting }
    });
  } catch (error) {
    console.error('Start meeting error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while starting meeting'
    });
  }
};

/**
 * POST /api/meetings/:id/stop
 * Stop an active meeting
 */
const stopMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const meeting = await Meeting.findOne({ 
      where: { id, user_id: userId }
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Meeting already completed'
      });
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.floor((endTime - meeting.start_time) / 1000); // seconds

    await meeting.update({
      status: 'completed',
      end_time: endTime,
      duration
    });

    // Emit event via Socket.IO
    try {
      const io = getIO();
      io.to(meeting.workspace_id).emit('meeting-stopped', {
        meetingId: meeting.id,
        endTime: meeting.end_time,
        duration: meeting.duration
      });
    } catch (socketError) {
      console.log('Socket.IO emit warning:', socketError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Meeting stopped successfully',
      data: { meeting }
    });
  } catch (error) {
    console.error('Stop meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while stopping meeting'
    });
  }
};

/**
 * GET /api/meetings
 * Get all meetings for user (with filters)
 */
const getAllMeetings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, workspaceId, limit = 50, page = 1 } = req.query;

    // Build query
    const where = { user_id: userId };
    if (status) where.status = status;
    if (workspaceId) where.workspace_id = workspaceId;

    const offset = (page - 1) * limit;

    const { count, rows: meetings } = await Meeting.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({
      success: true,
      data: {
        meetings,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching meetings'
    });
  }
};

/**
 * GET /api/meetings/:id
 * Get meeting by ID
 */
const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const meeting = await Meeting.findOne({ 
      where: { id, user_id: userId }
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { meeting }
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching meeting'
    });
  }
};

/**
 * DELETE /api/meetings/:id
 * Delete a meeting
 */
const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const meeting = await Meeting.findOne({ 
      where: { id, user_id: userId }
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    await meeting.destroy();

    return res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting meeting'
    });
  }
};

module.exports = {
  startMeeting,
  stopMeeting,
  getAllMeetings,
  getMeetingById,
  deleteMeeting
};
