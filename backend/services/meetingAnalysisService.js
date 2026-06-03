const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

/**
 * Real-time Meeting Analysis Service
 * Analyzes meeting transcripts to extract:
 * - Main points/topics discussed
 * - Assigned tasks/action items
 * - Important decisions
 * - Key takeaways
 */

/**
 * Analyze a meeting transcript chunk and extract key information
 * @param {string} transcriptText - Full or partial meeting transcript
 * @returns {Promise<Object>} Analysis result with main points, tasks, decisions
 */
const analyzeTranscript = async (transcriptText) => {
  try {
    if (!transcriptText || transcriptText.trim().length === 0) {
      return {
        success: false,
        error: 'Empty transcript provided'
      };
    }

    console.log(`📊 Analyzing transcript (${transcriptText.length} chars)`);

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    const analysisPrompt = `You are a professional meeting analyst. Analyze this meeting transcript and extract key information in structured format.

IMPORTANT: Respond ONLY with JSON (no other text).

Meeting Transcript:
"${transcriptText}"

Extract and return ONLY this JSON structure (no markdown, no extra text):
{
  "main_points": [
    "point 1",
    "point 2",
    "point 3"
  ],
  "tasks": [
    {
      "description": "what needs to be done",
      "assignee": "person name or 'To be assigned'",
      "priority": "high|medium|low"
    }
  ],
  "decisions": [
    "decision 1",
    "decision 2"
  ],
  "key_takeaways": "brief summary of what was discussed",
  "next_steps": [
    "step 1",
    "step 2"
  ]
}

Return ONLY the JSON object, nothing else.`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const analysisText = response.text().trim();

    console.log(`📝 Raw analysis response: ${analysisText.substring(0, 100)}...`);

    // Parse JSON response
    let analysis;
    try {
      // Try to extract JSON from the response (in case it has extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ Failed to parse analysis JSON:', parseError.message);
      return {
        success: false,
        error: 'Failed to parse analysis response',
        rawResponse: analysisText
      };
    }

    // Validate structure
    if (!analysis.main_points || !Array.isArray(analysis.main_points)) {
      analysis.main_points = [];
    }
    if (!analysis.tasks || !Array.isArray(analysis.tasks)) {
      analysis.tasks = [];
    }
    if (!analysis.decisions || !Array.isArray(analysis.decisions)) {
      analysis.decisions = [];
    }
    if (!analysis.next_steps || !Array.isArray(analysis.next_steps)) {
      analysis.next_steps = [];
    }

    console.log(`✅ Analysis complete:`);
    console.log(`   - Main Points: ${analysis.main_points.length}`);
    console.log(`   - Tasks: ${analysis.tasks.length}`);
    console.log(`   - Decisions: ${analysis.decisions.length}`);

    return {
      success: true,
      mainPoints: analysis.main_points,
      tasks: analysis.tasks,
      decisions: analysis.decisions,
      keyTakeaways: analysis.key_takeaways || '',
      nextSteps: analysis.next_steps,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ Analysis error:', error.message);

    // Check for rate limiting
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      console.log('⏳ Gemini rate limited - returning partial analysis');
      return {
        success: false,
        error: 'Rate limited - please try again in a moment',
        rateLimited: true
      };
    }

    return {
      success: false,
      error: error.message || 'Analysis failed'
    };
  }
};

/**
 * Generate a comprehensive meeting summary from analyzed data
 * @param {Object} analysisData - Result from analyzeTranscript
 * @returns {Promise<Object>} Formatted summary
 */
const generateMeetingSummary = async (analysisData) => {
  try {
    if (!analysisData || !analysisData.success) {
      return {
        success: false,
        error: 'Invalid analysis data'
      };
    }

    console.log(`📋 Generating summary from analysis data`);

    const summaryPrompt = `Create a professional meeting summary based on this data:

Main Points:
${analysisData.mainPoints.map(p => `- ${p}`).join('\n')}

Tasks:
${analysisData.tasks.map(t => `- ${t.description} (Assigned to: ${t.assignee}, Priority: ${t.priority})`).join('\n')}

Decisions Made:
${analysisData.decisions.map(d => `- ${d}`).join('\n')}

Key Takeaway: ${analysisData.keyTakeaways}

Next Steps:
${analysisData.nextSteps.map(s => `- ${s}`).join('\n')}

Write a brief executive summary (2-3 sentences) and then a detailed summary (3-5 bullet points).
Format as:
EXECUTIVE: [summary here]
DETAILED:
- point 1
- point 2
- point 3`;

    await new Promise(resolve => setTimeout(resolve, 500));

    const result = await model.generateContent(summaryPrompt);
    const response = await result.response;
    const summaryText = response.text();

    // Parse executive and detailed summaries
    const executiveMatch = summaryText.match(/EXECUTIVE:\s*([^\n]+(?:\n[^\n]+)*?(?=DETAILED:|$))/i);
    const detailedMatch = summaryText.match(/DETAILED:\s*([\s\S]*?)$/i);

    const executive = executiveMatch ? executiveMatch[1].trim() : summaryText.substring(0, 200);
    const detailed = detailedMatch ? detailedMatch[1].trim() : summaryText;

    console.log(`✅ Summary generated`);

    return {
      success: true,
      executive: executive,
      detailed: detailed,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('❌ Summary generation error:', error.message);
    return {
      success: false,
      error: error.message || 'Summary generation failed'
    };
  }
};

/**
 * Format analysis data for API response
 * @param {Object} analysisData - Analyzed meeting data
 * @returns {Object} Formatted response
 */
const formatAnalysisResponse = (analysisData) => {
  return {
    mainPoints: analysisData.mainPoints || [],
    actionItems: (analysisData.tasks || []).map(task => ({
      description: task.description,
      assignedTo: task.assignee,
      priority: task.priority,
      status: 'pending',
      createdAt: new Date()
    })),
    decisions: analysisData.decisions || [],
    keyTakeaways: analysisData.keyTakeaways || '',
    nextSteps: analysisData.nextSteps || [],
    analyzedAt: analysisData.timestamp || new Date()
  };
};

module.exports = {
  analyzeTranscript,
  generateMeetingSummary,
  formatAnalysisResponse
};
