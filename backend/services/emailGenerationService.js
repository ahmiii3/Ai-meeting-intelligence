const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Generate a professional follow-up email
 * @param {Object} emailData - Email data
 * @param {string} emailData.meetingTitle - Title of the meeting
 * @param {string} emailData.summary - Meeting summary
 * @param {Array} emailData.tasks - Array of tasks
 * @param {Array} emailData.decisions - Array of decisions
 * @param {string} emailData.recipientType - Type: 'organizer', 'task_owner', 'client', 'generic'
 * @param {string} emailData.recipientName - Recipient's name
 * @returns {Promise<Object>} Email object with subject and body
 */
const generateFollowupEmail = async (emailData) => {
  try {
    const {
      meetingTitle,
      summary,
      tasks = [],
      decisions = [],
      recipientType = 'generic',
      recipientName = 'Team'
    } = emailData;

    console.log(`📧 Generating ${recipientType} follow-up email for ${recipientName}`);

    let emailTemplate = '';

    if (recipientType === 'organizer') {
      emailTemplate = `Generate a professional follow-up email for the meeting organizer.
Include: Meeting summary, Action items assigned, Key decisions made, Next steps.
Tone: Professional but warm.

Meeting Title: ${meetingTitle}
Summary: ${summary}
Action Items: ${tasks.map(t => `- ${t.description} (Assigned to: ${t.assignee || 'TBD'})`).join('\n') || 'None'}
Decisions: ${decisions.map(d => `- ${d.decision}`).join('\n') || 'None'}

Generate the email (include subject and body):`;
    } else if (recipientType === 'task_owner') {
      emailTemplate = `Generate a professional task assignment email.
Format: Subject line, greeting, task description, deadline, what's next.
Tone: Professional, motivating.

Meeting Title: ${meetingTitle}
Assigned Tasks: ${tasks.map(t => `- ${t.description} (Due: ${t.deadline || 'ASAP'})`).join('\n')}

Generate the email with subject and body:`;
    } else if (recipientType === 'client') {
      emailTemplate = `Generate a professional client follow-up email from the meeting.
Include: Meeting summary, key commitments made, next steps, call-to-action.
Tone: Professional, customer-focused, build trust.

Meeting Title: ${meetingTitle}
Summary: ${summary}
Key Commitments: ${decisions.map(d => `- ${d.decision}`).join('\n') || 'None'}

Generate the email with subject and body:`;
    } else {
      emailTemplate = `Generate a professional meeting follow-up email.
Include: Summary, action items, decisions, next steps.
Tone: Professional, clear, actionable.

Meeting Title: ${meetingTitle}
Summary: ${summary}
Action Items: ${tasks.map(t => `- ${t.description}`).join('\n') || 'None'}
Decisions: ${decisions.map(d => `- ${d.decision}`).join('\n') || 'None'}

Generate email with subject and body (format: Subject: ... \\n\\nBody: ...):`;
    }

    const result = await model.generateContent(emailTemplate);
    const response = await result.response;
    let emailText = response.text();

    console.log(`📝 Raw email response: ${emailText.substring(0, 150)}...`);

    // Parse email (try to extract subject and body)
    let subject = 'Meeting Follow-up';
    let body = emailText;

    // Try to extract subject line
    const subjectMatch = emailText.match(/Subject:\s*(.+?)(?:\n\n|$)/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      body = emailText.replace(subjectMatch[0], '').trim();
    }

    // Try to extract body after "Body:"
    const bodyMatch = emailText.match(/Body:\s*(.+)$/is);
    if (bodyMatch) {
      body = bodyMatch[1].trim();
    }

    console.log(`✅ Email generated - Subject: "${subject}"`);

    return {
      subject: subject,
      body: body,
      recipientType: recipientType,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('❌ Email generation error:', error);

    return {
      subject: `Follow-up: ${emailData.meetingTitle}`,
      body: `Dear ${emailData.recipientName},\n\nThank you for attending our meeting today.\n\nBest regards`,
      recipientType: emailData.recipientType,
      generatedAt: new Date()
    };
  }
};

/**
 * Generate HTML formatted email
 * @param {Object} emailData - Email data including subject and body
 * @returns {string} HTML formatted email
 */
const formatEmailAsHTML = (emailData) => {
  const { subject, body, recipientName = 'Team', meetingTitle } = emailData;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
    .task { background: #fff; padding: 10px; margin: 10px 0; border-left: 4px solid #667eea; }
    .button { background: #667eea; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${subject}</h2>
    </div>
    <div class="content">
      <p>Dear ${recipientName},</p>
      <div style="white-space: pre-wrap; line-height: 1.6;">${body}</div>
      <p style="margin-top: 30px;">Best regards,<br>AI Meeting Intelligence</p>
    </div>
    <div class="footer">
      <p>This email was automatically generated from meeting transcript analysis.</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = {
  generateFollowupEmail,
  formatEmailAsHTML
};
