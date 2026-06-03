const Transcript = require('../models/Transcript');
const Meeting = require('../models/Meeting');

/**
 * GET /api/transcripts/:meetingId
 * Get all transcript chunks for a meeting
 */
const getMeetingTranscript = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.userId;

    // Verify meeting belongs to user
    const meeting = await Meeting.findOne({
      where: { id: meetingId, user_id: userId }
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Get all transcript chunks
    const transcripts = await Transcript.findAll({
      where: { meeting_id: meetingId },
      order: [['chunk_index', 'ASC']],
      attributes: ['id', 'chunk_index', 'text', 'timestamp', 'speaker', 'confidence']
    });

    // Combine all chunks into full transcript
    const fullTranscript = transcripts.map(t => t.text).join(' ');

    return res.status(200).json({
      success: true,
      data: {
        meetingId,
        chunks: transcripts,
        fullTranscript,
        totalChunks: transcripts.length
      }
    });
  } catch (error) {
    console.error('Get transcript error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching transcript'
    });
  }
};

/**
 * DELETE /api/transcripts/:meetingId
 * Delete all transcripts for a meeting
 */
const deleteTranscript = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.userId;

    // Verify meeting belongs to user
    const meeting = await Meeting.findOne({
      where: { id: meetingId, user_id: userId }
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Delete all transcripts
    await Transcript.destroy({
      where: { meeting_id: meetingId }
    });

    return res.status(200).json({
      success: true,
      message: 'Transcript deleted successfully'
    });
  } catch (error) {
    console.error('Delete transcript error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting transcript'
    });
  }
};

module.exports = {
  getMeetingTranscript,
  deleteTranscript
};
