const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * TEMPORARY MOCK TRANSCRIPTION
 * Browser WebM format is not compatible with OpenAI Whisper API
 * This provides a working demo until we implement proper audio conversion (FFmpeg)
 * or switch to Deepgram/AssemblyAI which handle WebM better
 */
const MOCK_MODE = true; // Set to false when proper audio conversion is implemented

const mockTranscriptions = [
  "Hello, this is a test of the transcription system.",
  "The meeting is progressing well with good discussion.",
  "We need to finalize the project timeline today.",
  "Action items will be sent out after this call.",
  "Does anyone have questions about the requirements?",
  "Let's review the budget for next quarter.",
  "The technical implementation looks promising.",
  "We should schedule a follow-up meeting next week.",
  "Thank you everyone for your participation.",
  "Please review the documents shared in the chat."
];

let mockIndex = 0;

/**
 * Transcribe audio buffer using OpenAI Whisper API
 * @param {Buffer} audioBuffer - Audio data buffer
 * @param {string} format - Audio format (webm, wav, mp3, etc.)
 * @returns {Promise<Object>} Transcription result
 */
const transcribeAudio = async (audioBuffer, format = 'webm') => {
  try {
    // Validate buffer size (minimum 1KB)
    if (audioBuffer.length < 1024) {
      return {
        success: false,
        error: 'Audio chunk too small, accumulate more data'
      };
    }

    console.log(`🎤 Transcribing audio buffer: ${audioBuffer.length} bytes, format: ${format}`);

    // MOCK MODE: Return demo transcriptions
    if (MOCK_MODE) {
      const text = mockTranscriptions[mockIndex % mockTranscriptions.length];
      mockIndex++;
      
      console.log(`✅ Mock transcription: "${text}"`);
      
      return {
        success: true,
        text: text,
        duration: 3,
        language: 'en',
        segments: []
      };
    }

    // REAL MODE: Call OpenAI Whisper API
    // NOTE: Browser WebM format causes "Invalid file format" error
    // Need FFmpeg or alternative transcription service (Deepgram/AssemblyAI)
    const audioFile = new File([audioBuffer], `audio.webm`, {
      type: 'audio/webm'
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text'
    });

    console.log(`✅ Transcription successful: "${transcription}"`);

    return {
      success: true,
      text: transcription,
      duration: null,
      language: 'en',
      segments: []
    };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    
    // Check for specific errors
    if (error.code === 'insufficient_quota') {
      return {
        success: false,
        error: 'OpenAI API quota exceeded. Please check your billing.'
      };
    }

    if (error.code === 'invalid_api_key') {
      return {
        success: false,
        error: 'Invalid OpenAI API key'
      };
    }

    return {
      success: false,
      error: error.message || 'Transcription failed'
    };
  }
};

/**
 * Transcribe audio chunk (small segment)
 * @param {Buffer} audioChunk - Small audio segment
 * @param {string} format - Audio format
 * @returns {Promise<Object>} Transcription result
 */
const transcribeChunk = async (audioChunk, format = 'webm') => {
  // For very small chunks, accumulate before transcribing
  if (audioChunk.length < 1024) { // Less than 1KB
    return {
      success: false,
      error: 'Audio chunk too small, accumulate more data'
    };
  }

  return transcribeAudio(audioChunk, format);
};

module.exports = {
  transcribeAudio,
  transcribeChunk
};
