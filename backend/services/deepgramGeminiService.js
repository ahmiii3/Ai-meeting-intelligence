const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

/**
 * Transcribe audio using Deepgram REST API
 * Using REST API directly to avoid SDK query string issues
 * @param {Buffer} audioBuffer - Audio data buffer
 * @param {string} format - Audio format ('webm', 'wav', 'mp3', etc.)
 * @param {string} mimeType - MIME type of the audio
 * @returns {Promise<Object>} Transcription result
 */
const transcribeWithDeepgram = async (audioBuffer, format = 'webm', mimeType = 'audio/webm') => {
  try {
    console.log(`🎤 Deepgram: Transcribing REAL USER SPEECH (${audioBuffer.length} bytes, format: ${format})`);

    // Validate buffer exists and has data
    if (!audioBuffer || audioBuffer.length === 0) {
      return {
        success: false,
        error: 'Audio buffer is empty'
      };
    }

    // Determine the actual audio format from magic bytes
    const magic = audioBuffer.subarray(0, 12);
    const magicHex = magic.toString('hex');
    console.log(`🔍 Audio buffer magic bytes: ${magicHex}`);

    // Detect actual format from file headers
    let detectedFormat = format;
    let contentType = mimeType;
    let isWAV = false;

    // RIFF header (WAV files) - starts with 52494646
    if (magicHex.startsWith('52494646')) { 
      detectedFormat = 'wav';
      contentType = 'audio/wav';
      isWAV = true;
      console.log(`✅ Detected WAV format from RIFF header`);
    }
    // WebM header - starts with 1a45dfa3
    else if (magicHex.startsWith('1a45dfa3')) {
      detectedFormat = 'webm';
      contentType = 'audio/webm';
      console.log(`✅ Detected WebM format from header`);
    }
    // MP3 header
    else if (magicHex.startsWith('fff') || magicHex.startsWith('49443')) {
      detectedFormat = 'mp3';
      contentType = 'audio/mpeg';
      console.log(`✅ Detected MP3 format from header`);
    }
    // OGG header
    else if (magicHex.startsWith('4f6767')) {
      detectedFormat = 'ogg';
      contentType = 'audio/ogg';
      console.log(`✅ Detected OGG format from header`);
    }

    console.log(`🌐 Detected Format: ${detectedFormat} | Content-Type: ${contentType}`);

    // Use REST API directly - build minimal query string
    // Only use parameters Deepgram actually accepts
    const queryParams = new URLSearchParams({
      model: 'nova-2',
      language: 'en'
    });

    // Don't add extra parameters - let Deepgram auto-detect format
    // Extra params can cause "Invalid query string" errors
    
    const url = `https://api.deepgram.com/v1/listen?${queryParams.toString()}`;

    console.log(`🌐 Deepgram URL: ${url.substring(0, 50)}... (key redacted)`);
    console.log(`📤 Sending ${audioBuffer.length} bytes with Content-Type: ${contentType}`);

    // Make the request to Deepgram
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': contentType,
        'Accept': 'application/json'
      },
      body: audioBuffer
    });

    console.log(`📊 Deepgram Response Status: ${response.status}`);

    // If WAV succeeded, we're done - return result
    if (response.ok && isWAV) {
      const result = await response.json();
      const transcript = result.results?.channels[0]?.alternatives[0]?.transcript || '';
      
      if (!transcript || transcript.trim().length === 0) {
        return {
          success: false,
          error: 'No speech detected in WAV audio - please speak louder and clearer'
        };
      }

      console.log(`✅ Deepgram WAV Success: "${transcript}"`);
      return {
        success: true,
        text: transcript.trim(),
        confidence: result.results?.channels[0]?.alternatives[0]?.confidence || null,
        duration: result.metadata?.duration || null
      };
    }

    // If WebM failed, try one more time
    if (!response.ok && detectedFormat === 'webm') {
      console.log(`⚠️  WebM failed (${response.status}), attempting single retry...`);
      const errorText = await response.text();
      console.log(`⚠️  Error: ${errorText.substring(0, 150)}`);
      
      // Build same URL for retry
      const retryUrl = `https://api.deepgram.com/v1/listen?model=nova-2&language=en`;

      response = await fetch(retryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/webm',
          'Accept': 'application/json'
        },
        body: audioBuffer
      });

      console.log(`📊 Deepgram Retry Response Status: ${response.status}`);
    }

    // Check if final response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error(`❌ Deepgram API error (${response.status}):`, errorData);

      return {
        success: false,
        error: `Deepgram error (${response.status}): ${errorData.err_msg || errorData.error || 'Unknown'}`
      };
    }

    const result = await response.json();
    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript || '';
    
    if (!transcript || transcript.trim().length === 0) {
      return {
        success: false,
        error: 'No speech detected - please speak louder and clearer'
      };
    }

    console.log(`✅ Deepgram Success: "${transcript}"`);

    return {
      success: true,
      text: transcript.trim(),
      confidence: result.results?.channels[0]?.alternatives[0]?.confidence || null,
      duration: result.metadata?.duration || null
    };

  } catch (error) {
    console.error('❌ Deepgram exception:', error.message);
    return {
      success: false,
      error: `Transcription failed: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * Translate text using Gemini
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language (default: Urdu)
 * @returns {Promise<Object>} Translation result
 */
const translateWithGemini = async (text, targetLanguage = 'Urdu') => {
  try {
    console.log(`🌐 Gemini: Translating to ${targetLanguage}: "${text}"`);

    // Add delay to respect rate limits (free tier has limits)
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

    // Clear, explicit prompt to get translation only
    const prompt = `You are a professional translator. Translate the following English text to ${targetLanguage}.
IMPORTANT: Return ONLY the translation in ${targetLanguage}, nothing else. No explanations, no quotes, no extra text.

English: "${text}"
${targetLanguage} Translation:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translation = response.text();

    console.log(`📨 Raw Gemini response: "${translation}"`);

    if (!translation || translation.trim().length === 0) {
      console.warn(`⚠️ Empty translation from Gemini for target language: ${targetLanguage}`);
      return {
        success: false,
        error: 'Empty translation received',
        originalText: text
      };
    }

    const cleanedTranslation = translation.trim();
    console.log(`✅ Gemini translation: "${cleanedTranslation}"`);

    return {
      success: true,
      originalText: text,
      translatedText: cleanedTranslation,
      targetLanguage: targetLanguage
    };
  } catch (error) {
    console.error('❌ Gemini translation error:', error.message);
    
    // Check for rate limit or service unavailable
    if (error.status === 503 || error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      console.log('⏳ Gemini rate limited - showing original English text');
      return {
        success: true,
        originalText: text,
        translatedText: text, // Fallback: show original text
        targetLanguage: targetLanguage,
        rateLimited: true
      };
    }

    return {
      success: false,
      error: error.message || 'Translation failed',
      originalText: text
    };
  }
};

/**
 * Complete workflow: Transcribe with Deepgram + Translate with Gemini
 * REAL-TIME VERSION: Actually transcribes your speech
 * @param {Buffer} audioBuffer - Audio data buffer
 * @param {string} targetLanguage - Target language for translation
 * @returns {Promise<Object>} Complete result
 */
const transcribeAndTranslate = async (audioBuffer, targetLanguage = 'Urdu') => {
  try {
    console.log(`🎤 Processing REAL audio (${audioBuffer.length} bytes) for transcription + translation to ${targetLanguage}`);

    // Step 1: Deepgram transcription
    const transcription = await transcribeWithDeepgram(audioBuffer);

    if (!transcription.success || !transcription.text || transcription.text.trim().length === 0) {
      console.log(`⚠️ Transcription failed or empty: ${transcription.error}`);
      return {
        success: false,
        step: 'transcription',
        error: transcription.error || 'No speech detected'
      };
    }

    console.log(`🎭 REAL transcript: "${transcription.text}"`);

    // Step 2: Translate with Gemini
    const translation = await translateWithGemini(transcription.text, targetLanguage);

    if (!translation.success) {
      // Return transcription even if translation fails
      return {
        success: true,
        step: 'translation_failed',
        transcription: transcription.text,
        confidence: transcription.confidence,
        error: translation.error
      };
    }

    // Success: Both transcription and translation worked
    return {
      success: true,
      transcription: transcription.text,
      translation: translation.translatedText,
      confidence: transcription.confidence,
      targetLanguage: targetLanguage
    };

  } catch (error) {
    console.error('❌ Transcribe & Translate error:', error);
    return {
      success: false,
      error: error.message || 'Process failed'
    };
  }
};

module.exports = {
  transcribeWithDeepgram,
  translateWithGemini,
  transcribeAndTranslate
};
