const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Detect action items/tasks from meeting transcript
 * @param {string} transcriptText - The transcribed meeting text
 * @param {string} meetingId - Meeting ID for storing tasks
 * @returns {Promise<Array>} Array of detected tasks
 */
const detectTasksFromTranscript = async (transcriptText, meetingId) => {
  try {
    console.log(`🔍 Analyzing transcript for tasks in meeting: ${meetingId}`);

    const prompt = `You are an AI meeting analyzer. Extract all action items/tasks from this meeting transcript.

For each task, provide:
1. Task description (what needs to be done)
2. Assignee (person assigned, if mentioned - can be "Unassigned")
3. Deadline (if mentioned, format as YYYY-MM-DD)
4. Priority (high, medium, or low based on context)
5. Confidence score (0.0 to 1.0 - how confident you are this is a real task)

Only extract EXPLICIT commitments and action items, not suggestions or discussions.
Ignore questions and hypotheticals.

Format your response as a JSON array like this:
[
  {
    "description": "Complete project proposal",
    "assignee": "John Smith",
    "deadline": "2024-01-15",
    "priority": "high",
    "confidence": 0.95
  },
  {
    "description": "Schedule follow-up meeting",
    "assignee": "Sarah Johnson",
    "deadline": null,
    "priority": "medium",
    "confidence": 0.85
  }
]

IMPORTANT: Return ONLY valid JSON, no other text.

Meeting Transcript:
---
${transcriptText}
---

Extracted Tasks (JSON only):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(`📝 Raw AI response: ${text.substring(0, 200)}...`);

    // Parse JSON response
    let tasks = [];
    try {
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      tasks = JSON.parse(cleanedText);

      if (!Array.isArray(tasks)) {
        console.warn('⚠️ AI response is not an array, wrapping in array');
        tasks = [tasks];
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError.message);
      console.log('Raw response:', text);
      return [];
    }

    // Store tasks in database
    const storedTasks = [];
    for (const task of tasks) {
      try {
        const createdTask = await Task.create({
          meeting_id: meetingId,
          description: task.description,
          assignee: task.assignee || null,
          priority: task.priority || 'medium',
          status: 'pending',
          deadline: task.deadline ? new Date(task.deadline) : null,
          detected_by_ai: true,
          confidence_score: task.confidence || 0.85
        });

        storedTasks.push(createdTask);
        console.log(`✅ Task created: "${task.description}" (confidence: ${task.confidence || 0.85})`);
      } catch (error) {
        console.error('❌ Error storing task:', error.message);
      }
    }

    console.log(`📊 Detected and stored ${storedTasks.length} tasks`);
    return storedTasks;
  } catch (error) {
    console.error('❌ Task detection error:', error);
    return [];
  }
};

/**
 * Generate meeting summary
 * @param {string} transcriptText - Full meeting transcript
 * @param {string} meetingId - Meeting ID
 * @param {string} summaryType - Type: 'executive', 'detailed', 'bullet_points'
 * @returns {Promise<Object>} Summary object
 */
const generateMeetingSummary = async (transcriptText, meetingId, summaryType = 'detailed') => {
  try {
    console.log(`📋 Generating ${summaryType} summary for meeting: ${meetingId}`);

    let summaryPrompt = '';

    if (summaryType === 'executive') {
      summaryPrompt = `Create a 2-3 sentence executive summary of this meeting.
Focus on: main topic, key decision, next steps.

Meeting Transcript:
---
${transcriptText}
---

Executive Summary:`;
    } else if (summaryType === 'detailed') {
      summaryPrompt = `Create a detailed meeting summary with 5-8 bullet points.
Include: Topics discussed, Key decisions, Action items, Next steps.

Format as bullet points (use - prefix).

Meeting Transcript:
---
${transcriptText}
---

Detailed Summary:`;
    } else if (summaryType === 'bullet_points') {
      summaryPrompt = `Summarize this meeting in concise bullet points (max 10).
One idea per bullet.

Meeting Transcript:
---
${transcriptText}
---

Bullet Points:`;
    }

    const result = await model.generateContent(summaryPrompt);
    const response = await result.response;
    const summaryText = response.text();

    console.log(`✅ Summary generated (${summaryType})`);

    return {
      summary: summaryText,
      summaryType: summaryType,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('❌ Summary generation error:', error);
    return {
      summary: 'Failed to generate summary',
      summaryType: summaryType,
      generatedAt: new Date()
    };
  }
};

/**
 * Extract key decisions from transcript
 * @param {string} transcriptText - Meeting transcript
 * @returns {Promise<Array>} Array of decisions
 */
const extractDecisions = async (transcriptText) => {
  try {
    console.log(`⚖️ Extracting key decisions from transcript`);

    const prompt = `Extract all key DECISIONS made in this meeting.
A decision is something that was approved, rejected, or committed to.

Format as JSON array:
[
  {
    "decision": "Approved marketing budget of $50,000",
    "status": "approved",
    "owner": "CFO"
  }
]

Return ONLY valid JSON.

Meeting Transcript:
---
${transcriptText}
---

Decisions (JSON only):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const decisions = JSON.parse(cleanedText);
      console.log(`✅ Extracted ${decisions.length} key decisions`);
      return decisions;
    } catch (parseError) {
      console.warn('⚠️ Failed to parse decisions JSON');
      return [];
    }
  } catch (error) {
    console.error('❌ Decision extraction error:', error);
    return [];
  }
};

module.exports = {
  detectTasksFromTranscript,
  generateMeetingSummary,
  extractDecisions
};
