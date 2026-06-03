const express = require('express');
const router = express.Router();
const { transcribeAndTranslate } = require('../services/deepgramGeminiService');

/**
 * Test endpoint for Deepgram + Gemini integration
 * POST /api/test/translation
 * Body: { text: "Hello world" }
 */
router.post('/translation', async (req, res) => {
  try {
    const { text, targetLanguage = 'Urdu' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    // Test Gemini translation only (without audio)
    const { translateWithGemini } = require('../services/deepgramGeminiService');
    const result = await translateWithGemini(text, targetLanguage);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Translation test error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Translation test failed'
    });
  }
});

/**
 * Health check for API keys
 * GET /api/test/health
 */
router.get('/health', (req, res) => {
  const checks = {
    deepgram: !!process.env.DEEPGRAM_API_KEY && process.env.DEEPGRAM_API_KEY !== 'your_deepgram_api_key_here',
    gemini: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here',
    openai: !!process.env.OPENAI_API_KEY
  };

  return res.status(200).json({
    success: true,
    message: 'API Health Check',
    data: {
      apiKeys: checks,
      allConfigured: checks.deepgram && checks.gemini
    }
  });
});

module.exports = router;