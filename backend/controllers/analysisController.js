const Transcript = require('../models/Transcript');
const Meeting = require('../models/Meeting');
const { analyzeTranscript, generateMeetingSummary, formatAnalysisResponse } = require('../services/meetingAnalysisService');

/**
 * GET /api/analysis/meeting/:meetingId
 * Analyze a complete meeting transcript
 */
const analyzeMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { includeAnalysis = true, includeSummary = false } = req.query;

    console.log(`📊 Analyzing meeting: ${meetingId}`);

    // Get all transcripts for this meeting
    const transcripts = await Transcript.findAll({
      where: { meeting_id: meetingId },
      order: [['chunk_index', 'ASC']]
    });

    if (transcripts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No transcripts found for this meeting'
      });
    }

    // Combine all transcript chunks into one document
    const fullTranscript = transcripts
      .map(t => t.text)
      .join(' ');

    console.log(`📝 Full transcript length: ${fullTranscript.length} characters`);

    if (includeAnalysis === 'true' || includeAnalysis === true) {
      // Analyze the complete transcript
      const analysis = await analyzeTranscript(fullTranscript);

      if (!analysis.success) {
        return res.status(500).json({
          success: false,
          error: analysis.error,
          rateLimited: analysis.rateLimited
        });
      }

      const formattedAnalysis = formatAnalysisResponse(analysis);

      // Optionally generate summary
      if (includeSummary === 'true' || includeSummary === true) {
        const summary = await generateMeetingSummary(analysis);
        return res.json({
          success: true,
          meetingId,
          transcriptLength: fullTranscript.length,
          chunkCount: transcripts.length,
          analysis: formattedAnalysis,
          summary: summary.success ? {
            executive: summary.executive,
            detailed: summary.detailed
          } : null,
          generatedAt: new Date()
        });
      }

      return res.json({
        success: true,
        meetingId,
        transcriptLength: fullTranscript.length,
        chunkCount: transcripts.length,
        analysis: formattedAnalysis,
        generatedAt: new Date()
      });
    }

    res.json({
      success: true,
      meetingId,
      transcriptLength: fullTranscript.length,
      chunkCount: transcripts.length,
      message: 'Meeting transcript retrieved. Set includeAnalysis=true to analyze.'
    });
  } catch (error) {
    console.error('❌ Error analyzing meeting:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed'
    });
  }
};

/**
 * GET /api/analysis/meeting/:meetingId/summary
 * Get or generate meeting summary
 */
const getMeetingSummary = async (req, res) => {
  try {
    const { meetingId } = req.params;

    console.log(`📋 Getting summary for meeting: ${meetingId}`);

    // Get all transcripts
    const transcripts = await Transcript.findAll({
      where: { meeting_id: meetingId },
      order: [['chunk_index', 'ASC']]
    });

    if (transcripts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No transcripts found for this meeting'
      });
    }

    // Combine transcripts
    const fullTranscript = transcripts
      .map(t => t.text)
      .join(' ');

    // Analyze
    const analysis = await analyzeTranscript(fullTranscript);

    if (!analysis.success) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }

    // Generate summary
    const summary = await generateMeetingSummary(analysis);

    if (!summary.success) {
      return res.status(500).json({
        success: false,
        error: summary.error
      });
    }

    res.json({
      success: true,
      meetingId,
      executive: summary.executive,
      detailed: summary.detailed,
      keyPoints: analysis.mainPoints,
      actionItems: analysis.tasks,
      decisions: analysis.decisions,
      generatedAt: summary.generatedAt
    });
  } catch (error) {
    console.error('❌ Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Summary generation failed'
    });
  }
};

/**
 * GET /api/analysis/meeting/:meetingId/action-items
 * Get all detected action items/tasks
 */
const getActionItems = async (req, res) => {
  try {
    const { meetingId } = req.params;

    console.log(`✅ Getting action items for meeting: ${meetingId}`);

    const transcripts = await Transcript.findAll({
      where: { meeting_id: meetingId },
      order: [['chunk_index', 'ASC']]
    });

    if (transcripts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No transcripts found'
      });
    }

    const fullTranscript = transcripts
      .map(t => t.text)
      .join(' ');

    const analysis = await analyzeTranscript(fullTranscript);

    if (!analysis.success) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }

    res.json({
      success: true,
      meetingId,
      actionItems: analysis.tasks.map(task => ({
        description: task.description,
        assignedTo: task.assignee,
        priority: task.priority,
        status: 'pending',
        detectedAt: analysis.timestamp
      })),
      mainPoints: analysis.mainPoints,
      decisions: analysis.decisions,
      nextSteps: analysis.nextSteps
    });
  } catch (error) {
    console.error('❌ Error getting action items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  analyzeMeeting,
  getMeetingSummary,
  getActionItems
};
