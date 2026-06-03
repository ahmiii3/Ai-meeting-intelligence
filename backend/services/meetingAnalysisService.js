const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

// Initialize Gemini (backup only)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

// Initialize OpenAI (PRIMARY)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log('🔧 Analysis Service: Using OpenAI (primary) with Gemini fallback');

/**
 * Real-time Meeting Analysis Service
 * Analyzes meeting transcripts to extract:
 * - Main points/topics discussed
 * - Assigned tasks/action items
 * - Important decisions
 * - Key takeaways
 * 
 * Uses OpenAI as primary (better rate limits, more reliable)
 * Falls back to Gemini if needed
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
    await new Promise(resolve => setTimeout(resolve, 300));

    const analysisPrompt = `You are a STRICT meeting analyst. ONLY extract REAL business tasks and ignore noise/casual talk.

STRICT RULES:
1. ONLY extract tasks that contain BOTH:
   - A PERSON NAME (Ahmed, Fatima, Sara, Ali, Mohammad, Hasan, Zainab, Noor, etc.)
   - AND a CLEAR ACTION VERB (handle, work on, develop, design, build, create, manage, responsible for, will do)
   - AND a SPECIFIC DELIVERABLE (backend, database, frontend, API, documentation, testing, etc.)

2. IGNORE these (not real tasks):
   - Random chatter ("love you", "yeah", "alright", "hello")
   - Unclear phrases without clear person+action+deliverable
   - Emotional expressions
   - Greetings
   - Repeated or duplicate phrases

3. Examples of VALID tasks:
   ✅ "Ahmed will handle backend development" → Task: "Backend development" → Ahmed
   ✅ "Fatima will work on database design" → Task: "Database design" → Fatima
   ✅ "Ali responsible for API testing" → Task: "API testing" → Ali

4. Examples of INVALID (ignore):
   ❌ "love you"
   ❌ "yeah alright"
   ❌ "hello hello"
   ❌ Just a name without action
   ❌ Action without person

Meeting Transcript:
"${transcriptText}"

CRITICAL:
- Be VERY STRICT - only extract real business tasks
- Ignore 90% of casual talk and noise
- If unsure, DO NOT include it
- Return ONLY the JSON, no other text

Return this JSON structure:
{
  "main_points": ["only significant business points"],
  "tasks": [
    {
      "description": "specific deliverable (e.g., Backend development, Database design)",
      "assignee": "person name or 'Unassigned'",
      "priority": "high if deadline/urgent mentioned, else medium"
    }
  ],
  "decisions": ["only real business decisions"],
  "key_takeaways": "brief summary of REAL meeting content",
  "next_steps": ["only actionable next steps"]
}

Return ONLY valid JSON. No markdown. No explanation.`;

    // Try OpenAI first (primary)
    console.log('🤖 Using OpenAI for analysis...');
    let analysisText;
    let useOpenAI = true;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional meeting analyst. Extract meeting information and return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      analysisText = completion.choices[0].message.content.trim();
      console.log(`✅ OpenAI analysis successful`);
    } catch (openaiError) {
      console.warn(`⚠️  OpenAI error: ${openaiError.message}`);
      console.log('🔄 Falling back to Gemini...');
      useOpenAI = false;

      try {
        const result = await geminiModel.generateContent(analysisPrompt);
        const response = await result.response;
        analysisText = response.text().trim();
        console.log(`✅ Gemini fallback successful`);
      } catch (geminiError) {
        console.error(`❌ Gemini also failed: ${geminiError.message}`);
        
        // If both fail, use fallback analysis
        if (geminiError.message?.includes('429') || geminiError.message?.includes('quota')) {
          console.log('⏳ Both APIs rate-limited - using keyword fallback');
          return generateFallbackAnalysis(transcriptText);
        }

        return {
          success: false,
          error: 'Analysis failed with both OpenAI and Gemini'
        };
      }
    }

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
      console.log('ℹ️  Raw response was:', analysisText.substring(0, 200));
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

    // Check for rate limiting - if rate limited, use fallback analysis
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      console.log('⏳ Gemini rate limited - using fallback analysis with keyword extraction');
      
      // Fallback: Extract using simple keyword matching
      return generateFallbackAnalysis(transcriptText);
    }

    return {
      success: false,
      error: error.message || 'Analysis failed'
    };
  }
};

/**
 * Fallback analysis using keyword extraction (no API calls)
 * Used when Gemini API is rate-limited
 */
const generateFallbackAnalysis = (transcriptText) => {
  console.log('🔍 Extracting information using keyword-based analysis...');
  
  const text = transcriptText.toLowerCase();
  
  // Extract main points (sentences with important keywords)
  const sentences = transcriptText.split(/[.!?]/);
  const mainPoints = sentences
    .filter(s => s.length > 10)
    .slice(0, 5)
    .map(s => s.trim());
  
  // Extract tasks (look for assignment keywords)
  const taskKeywords = ['assign', 'task', 'work', 'handle', 'do', 'responsible', 'take', 'develop', 'design'];
  const tasks = [];
  
  // Common names to look for
  const names = ['ahmed', 'fatima', 'sara', 'ali', 'mohammad', 'hasan', 'zainab', 'noor'];
  
  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    const hasTaskKeyword = taskKeywords.some(kw => lower.includes(kw));
    const hasName = names.some(name => lower.includes(name));
    
    if (hasTaskKeyword && hasName) {
      // Extract the name and description
      for (const name of names) {
        if (lower.includes(name)) {
          // Find words after the name (task description)
          const nameIndex = lower.indexOf(name);
          const afterName = sentence.substring(nameIndex + name.length).trim();
          
          if (afterName.length > 5) {
            tasks.push({
              description: afterName.substring(0, 80),
              assignee: name.charAt(0).toUpperCase() + name.slice(1),
              priority: lower.includes('important') || lower.includes('urgent') || lower.includes('critical') ? 'high' : 'medium'
            });
            break;
          }
        }
      }
    }
  });
  
  // Extract decisions
  const decisionKeywords = ['decided', 'decide', 'will', 'shall', 'must', 'should'];
  const decisions = sentences
    .filter(s => decisionKeywords.some(kw => s.toLowerCase().includes(kw)))
    .slice(0, 3)
    .map(s => s.trim());
  
  // Extract next steps
  const nextStepsKeywords = ['next', 'then', 'after', 'following', 'deadline', 'friday', 'monday'];
  const nextSteps = sentences
    .filter(s => nextStepsKeywords.some(kw => s.toLowerCase().includes(kw)))
    .slice(0, 3)
    .map(s => s.trim());
  
  console.log(`✅ Fallback analysis complete:`);
  console.log(`   - Main Points: ${mainPoints.length}`);
  console.log(`   - Tasks: ${tasks.length}`);
  console.log(`   - Decisions: ${decisions.length}`);
  
  return {
    success: true,
    mainPoints: mainPoints.length > 0 ? mainPoints : ['Meeting discussion'],
    tasks: tasks.length > 0 ? tasks : [{
      description: 'Review meeting notes',
      assignee: 'Team',
      priority: 'medium'
    }],
    decisions: decisions.length > 0 ? decisions : ['Meeting completed'],
    keyTakeaways: 'Meeting analysis completed using keyword extraction due to API rate limiting',
    nextSteps: nextSteps.length > 0 ? nextSteps : ['Follow up on action items'],
    timestamp: new Date(),
    fallbackMode: true
  };
};

/**
 * Generate a comprehensive meeting summary from analyzed data
 * Uses OpenAI (primary) or Gemini (fallback)
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

    await new Promise(resolve => setTimeout(resolve, 300));

    let summaryText;

    try {
      // Try OpenAI first (primary)
      console.log('🤖 Using OpenAI for summary generation...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional meeting summarizer. Create clear, concise summaries.'
          },
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      summaryText = completion.choices[0].message.content;
      console.log(`✅ OpenAI summary generation successful`);
    } catch (openaiError) {
      console.warn(`⚠️  OpenAI summary failed: ${openaiError.message}`);
      console.log('🔄 Falling back to Gemini for summary...');

      try {
        const result = await geminiModel.generateContent(summaryPrompt);
        const response = await result.response;
        summaryText = response.text();
        console.log(`✅ Gemini fallback summary successful`);
      } catch (geminiError) {
        console.error(`❌ Gemini also failed: ${geminiError.message}`);
        
        // Return basic summary if both fail
        return {
          success: true,
          executive: 'Meeting analysis completed',
          detailed: analysisData.mainPoints.join('\n'),
          generatedAt: new Date(),
          note: 'Generated with fallback method due to API errors'
        };
      }
    }

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
  formatAnalysisResponse,
  generateFallbackAnalysis
};
